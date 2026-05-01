import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { requestWithFallback } from '../config/api';
import { clearStoredToken, getStoredToken, setStoredToken } from '../auth/tokenStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [ready, setReady] = useState(false);

  const fetchProfile = useCallback(async () => {
    const response = await requestWithFallback('/api/users/me', {
      method: 'GET',
      skipAuth: false,
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok || !json.success || !json.data) {
      throw new Error(json.message || 'Failed to fetch current user');
    }

    setCurrentUser(json.data);
    return json.data;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await getStoredToken();
        if (!stored) {
          if (!cancelled) setToken(null);
          return;
        }

        // Ensure persisted token still maps to an existing user.
        const response = await requestWithFallback('/api/users/me', {
          method: 'GET',
          skipAuth: false,
        });

        if (!response.ok) {
          await clearStoredToken();
          if (!cancelled) {
            setToken(null);
            setCurrentUser(null);
          }
          return;
        }

        if (!cancelled) {
          setToken(stored);
          await fetchProfile().catch(async () => {
            await clearStoredToken();
            if (!cancelled) {
              setToken(null);
              setCurrentUser(null);
            }
          });
        }
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
    await fetchProfile();
    return json;
  }, []);

  const register = useCallback(async ({ name, email, password, phone }) => {
    const response = await requestWithFallback('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone }),
      skipAuth: true,
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(json.message || `Register failed (${response.status})`);
      error.status = response.status;
      error.payload = json;
      throw error;
    }
    if (!json.success) {
      throw new Error(json.message || 'Register failed');
    }

    if (json.token) {
      await setStoredToken(json.token);
      setToken(json.token);
      await fetchProfile();
    }

    return { status: response.status, data: json };
  }, [fetchProfile]);

  const resetPassword = useCallback(async ({ email, newPassword, confirmPassword }) => {
    const response = await requestWithFallback('/api/users/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, newPassword, confirmPassword }),
      skipAuth: true,
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(json.message || `Reset failed (${response.status})`);
    }
    if (!json.success || !json.token) {
      throw new Error(json.message || 'Reset failed');
    }

    await setStoredToken(json.token);
    setToken(json.token);
    await fetchProfile();

    return json;
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    await clearStoredToken();
    setToken(null);
    setCurrentUser(null);
  }, []);

  const updateToken = useCallback(async (newToken) => {
    await setStoredToken(newToken);
    setToken(newToken);
  }, []);

  const value = useMemo(
    () => ({
      token,
      currentUser,
      role: currentUser?.role || null,
      ready,
      login,
      register,
      resetPassword,
      logout,
      updateToken,
      refreshProfile: fetchProfile,
      isAuthenticated: Boolean(token),
      isAdmin: currentUser?.role === 'admin',
    }),
    [token, currentUser, ready, login, register, resetPassword, logout, updateToken, fetchProfile]
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
