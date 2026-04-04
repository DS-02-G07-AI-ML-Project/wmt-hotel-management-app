import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { requestWithFallback } from '../config/api';
import { clearStoredToken, getStoredToken, setStoredToken } from '../auth/tokenStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await getStoredToken();
        if (!cancelled) setToken(stored);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await requestWithFallback('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(json.message || `Login failed (${response.status})`);
    }
    if (!json.success || !json.token) {
      throw new Error(json.message || 'Login failed');
    }
    await setStoredToken(json.token);
    setToken(json.token);
    return json;
  }, []);

  const register = useCallback(async ({ name, email, password, role }) => {
    const response = await requestWithFallback('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
      skipAuth: true,
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(json.message || `Register failed (${response.status})`);
    }
    if (!json.success || !json.token) {
      throw new Error(json.message || 'Register failed');
    }
    await setStoredToken(json.token);
    setToken(json.token);
    return json;
  }, []);

  const logout = useCallback(async () => {
    await clearStoredToken();
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      ready,
      login,
      register,
      logout,
      isAuthenticated: Boolean(token),
    }),
    [token, ready, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
