import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { requestWithFallback } from '../../config/api';

const PASSWORD_REQUIREMENTS = [
  { regex: /.{6,}/, label: 'At least 6 characters' },
  { regex: /[A-Z]/, label: 'At least one uppercase letter' },
  { regex: /\d/, label: 'At least one number' },
  { regex: /[!@#$%^&*]/, label: 'At least one special character (!@#$%^&*)' },
];

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [focusedField, setFocusedField] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  
  const [emailExistsError, setEmailExistsError] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const normalizedEmail = email.trim().toLowerCase();
  const isEmailValid = normalizedEmail ? validateEmail(normalizedEmail) : false;
  const passwordsMatch = Boolean(newPassword) && Boolean(confirmPassword) && newPassword === confirmPassword;
  const passwordsMismatch = Boolean(newPassword) && Boolean(confirmPassword) && newPassword !== confirmPassword;

  // Real-time email check
  useEffect(() => {
    const checkEmail = async () => {
      if (!isEmailValid) {
        setEmailExistsError('');
        return;
      }

      setIsCheckingEmail(true);
      try {
        const res = await requestWithFallback(`/api/users/check-email?email=${normalizedEmail}`, { skipAuth: true });
        const json = await res.json().catch(() => ({}));
        
        if (res.ok && json && json.exists === false) {
          setEmailExistsError('No account found');
        } else if (res.ok && json && json.exists === true) {
          setEmailExistsError('');
        } else {
          setEmailExistsError('');
        }
      } catch (err) {
        setEmailExistsError('');
      } finally {
        setIsCheckingEmail(false);
      }
    };

    const timer = setTimeout(() => {
      if (normalizedEmail) {
        checkEmail();
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [normalizedEmail, isEmailValid]);

  const passwordRequirements = useMemo(() => {
    return PASSWORD_REQUIREMENTS.map(req => ({
      ...req,
      met: req.regex.test(newPassword),
    }));
  }, [newPassword]);

  const metCount = passwordRequirements.filter(req => req.met).length;
  const allRequirementsMet = metCount === 4;

  let emailHelperError = '';
  if (attemptedSubmit && !normalizedEmail) {
    emailHelperError = 'Email is required';
  } else if (normalizedEmail && !isEmailValid) {
    if (!normalizedEmail.includes('@')) {
      emailHelperError = "Email must contain an '@' symbol.";
    } else if (!normalizedEmail.split('@')[1]?.includes('.')) {
      emailHelperError = "Email must contain a domain (e.g., .com).";
    } else {
      emailHelperError = "Please enter a valid email address.";
    }
  }

  let passwordDynamicError = '';
  if (newPassword) {
    if (!/.{6,}/.test(newPassword)) {
      passwordDynamicError = 'Password must be at least 6 characters.';
    } else if (!/[A-Z]/.test(newPassword)) {
      passwordDynamicError = 'Password must contain at least one uppercase letter.';
    } else if (!/\d/.test(newPassword)) {
      passwordDynamicError = 'Password must contain at least one number.';
    } else if (!/[!@#$%^&*]/.test(newPassword)) {
      passwordDynamicError = 'Password must contain at least one special character (!@#$%^&*).';
    }
  } else if (attemptedSubmit) {
    passwordDynamicError = 'Password is required.';
  }

  const handleReset = async () => {
    setError('');
    setSuccessMessage('');
    setAttemptedSubmit(true);

    if (!isEmailValid || !allRequirementsMet || !passwordsMatch || emailExistsError) {
      return;
    }

    setSaving(true);
    try {
      const body = JSON.stringify({
        email: normalizedEmail,
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      });

      const res = await requestWithFallback('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        skipAuth: true,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || json.error || 'Reset failed');
      }

      // Show success message on screen
      setSuccessMessage('✅ Password reset successfully!');
      setSaving(false);

      // Navigate to Login after a short delay to let user see the message
      setTimeout(() => {
        navigation.replace('Login');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
      setSaving(false);
    }
  };

  const getInputStyle = (field) => [
    styles.input,
    focusedField === field && styles.inputFocused,
    ((field === 'email' && (emailHelperError || emailExistsError)) || 
     (field === 'newPassword' && passwordDynamicError) ||
     (field === 'confirmPassword' && passwordsMismatch)) && styles.inputError
  ];

  let strengthColor = '#cbd5e1';
  let strengthLabel = '';
  if (newPassword.length > 0) {
    if (metCount <= 2) { strengthColor = '#ef4444'; strengthLabel = 'Weak'; }
    else if (metCount === 3) { strengthColor = '#f59e0b'; strengthLabel = 'Medium'; }
    else if (metCount === 4) { strengthColor = '#10b981'; strengthLabel = 'Strong'; }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Login')}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your email and your new password to reset your account.</Text>

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
        {successMessage ? <Text style={styles.successBanner}>{successMessage}</Text> : null}

        <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={getInputStyle('email')}
          value={email}
          onChangeText={setEmail}
          onFocus={() => setFocusedField('email')}
          onBlur={() => setFocusedField('')}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor="#94a3b8"
        />
        {emailHelperError ? (
          <Text style={styles.helperError}>{emailHelperError}</Text>
        ) : emailExistsError ? (
          <Text style={styles.helperError}>{emailExistsError}</Text>
        ) : successMessage ? (
          <Text style={styles.successText}>{successMessage}</Text>
        ) : null}

        <Text style={styles.label}>New Password <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={getInputStyle('newPassword')}
          value={newPassword}
          onChangeText={setNewPassword}
          onFocus={() => setFocusedField('newPassword')}
          onBlur={() => setFocusedField('')}
          secureTextEntry={true}
          placeholder="••••••••"
          placeholderTextColor="#94a3b8"
        />
        {newPassword.length > 0 && (
          <View style={styles.strengthContainer}>
            <View style={styles.strengthBarRow}>
              {[1, 2, 3, 4].map(idx => (
                <View 
                  key={idx} 
                  style={[
                    styles.strengthSegment, 
                    { backgroundColor: idx <= metCount ? strengthColor : '#e2e8f0' }
                  ]} 
                />
              ))}
            </View>
            <Text style={[styles.strengthLabel, { color: strengthColor }]}>
              {strengthLabel}
            </Text>
          </View>
        )}
        {passwordDynamicError ? (
          <Text style={[styles.helperError, newPassword.length > 0 && { marginTop: -8 }]}>
            {passwordDynamicError}
          </Text>
        ) : null}

        <Text style={styles.label}>Confirm New Password <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={getInputStyle('confirmPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          onFocus={() => setFocusedField('confirmPassword')}
          onBlur={() => setFocusedField('')}
          secureTextEntry={true}
          placeholder="••••••••"
          placeholderTextColor="#94a3b8"
        />
        {passwordsMismatch ? (
          <View style={styles.matchRow}>
            <Text style={styles.mismatchText}>Passwords do not match</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryBtn, (saving || isCheckingEmail || !email || !newPassword || passwordsMismatch) && styles.primaryBtnDisabled]}
          onPress={handleReset}
          disabled={saving || isCheckingEmail || !email || !newPassword || passwordsMismatch}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Reset Password</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f2f5fb' },
  scroll: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 48,
    paddingBottom: 40,
  },
  backBtn: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    fontWeight: '500',
  },
  successBanner: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 12,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 16,
  },
  inputFocused: {
    borderColor: '#2563eb',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 16,
  },
  strengthBarRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    height: 6,
  },
  strengthSegment: {
    flex: 1,
    height: '100%',
    borderRadius: 3,
  },
  strengthLabel: {
    marginLeft: 12,
    fontSize: 13,
    fontWeight: '700',
    width: 60,
    textAlign: 'right',
  },
  mismatchText: { color: '#ef4444', fontSize: 13, marginTop: -8, marginBottom: 16, fontWeight: '500' },
  matchRow: { marginTop: -8, marginBottom: 16 },
  helperError: { color: '#ef4444', fontSize: 12, marginTop: -12, marginBottom: 16 },
  successText: { color: '#059669', fontSize: 12, marginTop: -12, marginBottom: 16, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
