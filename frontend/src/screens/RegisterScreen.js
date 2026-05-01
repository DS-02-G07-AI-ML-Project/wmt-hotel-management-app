import React, { useMemo, useState } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { parsePhoneNumberFromString, AsYouType } from 'libphonenumber-js';

const PASSWORD_REQUIREMENTS = [
  { regex: /.{6,}/, label: 'At least 6 characters' },
  { regex: /[A-Z]/, label: 'At least one uppercase letter' },
  { regex: /\d/, label: 'At least one number' },
  { regex: /[!@#$%^&*]/, label: 'At least one special character (!@#$%^&*)' },
];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);

  const handlePhoneChange = (text) => {
    const formatter = new AsYouType('US');
    setPhone(formatter.input(text));
  };

  const passwordRequirements = useMemo(() => {
    return PASSWORD_REQUIREMENTS.map(req => ({
      ...req,
      met: req.regex.test(password),
    }));
  }, [password]);

  const metCount = passwordRequirements.filter(req => req.met).length;
  const allRequirementsMet = metCount === 4;

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const parseRegisterError = (err) => {
    const message = String(err?.message || '');
    if (/E11000|duplicate key/i.test(message)) {
      return 'This email is already registered.';
    }
    return message || 'Registration failed';
  };

  const normalizedEmail = email.trim().toLowerCase();
  const isFirstNameValid = firstName.trim().length > 1;
  const isLastNameValid = lastName.trim().length > 1;
  const isEmailValid = normalizedEmail ? validateEmail(normalizedEmail) : false;
  const passwordsMatch = Boolean(password) && Boolean(confirmPassword) && password === confirmPassword;
  const passwordsMismatch = Boolean(password) && Boolean(confirmPassword) && password !== confirmPassword;

  let isPhoneValid = true;
  if (phone) {
    const phoneNumber = parsePhoneNumberFromString(phone, 'US');
    isPhoneValid = phoneNumber ? phoneNumber.isValid() : false;
  }

  const isFormValid = isFirstNameValid && isLastNameValid && isEmailValid && allRequirementsMet && passwordsMatch && isPhoneValid && isAgreed;
  const isSubmitDisabled = loading || !isFormValid;

  let firstNameErrorText = '';
  if (firstName.trim().length > 0 && !isFirstNameValid) {
    firstNameErrorText = 'Must be at least 2 letters';
  } else if (attemptedSubmit && !isFirstNameValid) {
    firstNameErrorText = 'First name is required';
  }

  let lastNameErrorText = '';
  if (lastName.trim().length > 0 && !isLastNameValid) {
    lastNameErrorText = 'Must be at least 2 letters';
  } else if (attemptedSubmit && !isLastNameValid) {
    lastNameErrorText = 'Last name is required';
  }

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

  const phoneError = phone && !isPhoneValid ? 'Invalid phone number format' : '';

  let passwordDynamicError = '';
  if (password) {
    if (!/.{6,}/.test(password)) {
      passwordDynamicError = 'Password must be at least 6 characters.';
    } else if (!/[A-Z]/.test(password)) {
      passwordDynamicError = 'Password must contain at least one uppercase letter.';
    } else if (!/\d/.test(password)) {
      passwordDynamicError = 'Password must contain at least one number.';
    } else if (!/[!@#$%^&*]/.test(password)) {
      passwordDynamicError = 'Password must contain at least one special character (!@#$%^&*).';
    }
  } else if (attemptedSubmit) {
    passwordDynamicError = 'Password is required.';
  }

  const handleRegister = async () => {
    setError('');
    setAttemptedSubmit(true);

    if (!isFormValid) {
      return;
    }

    setLoading(true);
    try {
      if (__DEV__) {
        console.log('[Register] Sending request:', {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: normalizedEmail,
          phone: phone.trim(),
        });
      }

      await register({
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: normalizedEmail,
        password,
        phone: phone.trim(),
      });

      if (__DEV__) {
        console.log('[Register] Success - user registered and logged in');
      }
    } catch (e) {
      if (__DEV__) {
        console.error('[Register] Error:', e.message);
      }
      setError(parseRegisterError(e));
    } finally {
      setLoading(false);
    }
  };

  const getInputStyle = (field) => [
    styles.input,
    focusedField === field && styles.inputFocused,
    ((field === 'firstName' && firstNameErrorText) ||
      (field === 'lastName' && lastNameErrorText) ||
      (field === 'email' && emailHelperError) ||
      (field === 'phone' && phoneError) ||
      (field === 'password' && passwordDynamicError) ||
      (field === 'confirmPassword' && passwordsMismatch)) && styles.inputError
  ];

  let strengthColor = '#cbd5e1';
  let strengthLabel = '';
  if (password.length > 0) {
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

        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Create your customer account.</Text>

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>First Name <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={getInputStyle('firstName')}
              value={firstName}
              onChangeText={setFirstName}
              onFocus={() => setFocusedField('firstName')}
              onBlur={() => setFocusedField('')}
              placeholder="John"
              placeholderTextColor="#94a3b8"
            />
            {firstNameErrorText ? <Text style={styles.helperError}>{firstNameErrorText}</Text> : null}
          </View>
          <View style={styles.spacing} />
          <View style={styles.flex1}>
            <Text style={styles.label}>Last Name <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={getInputStyle('lastName')}
              value={lastName}
              onChangeText={setLastName}
              onFocus={() => setFocusedField('lastName')}
              onBlur={() => setFocusedField('')}
              placeholder="Smith"
              placeholderTextColor="#94a3b8"
            />
            {lastNameErrorText ? <Text style={styles.helperError}>{lastNameErrorText}</Text> : null}
          </View>
        </View>

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
        {emailHelperError ? <Text style={styles.helperError}>{emailHelperError}</Text> : null}

        <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={getInputStyle('phone')}
          value={phone}
          onChangeText={handlePhoneChange}
          onFocus={() => setFocusedField('phone')}
          onBlur={() => setFocusedField('')}
          keyboardType="phone-pad"
          placeholder="+1 234 567 8900"
          placeholderTextColor="#94a3b8"
        />
        {phoneError ? <Text style={styles.helperError}>{phoneError}</Text> : null}

        <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={getInputStyle('password')}
          value={password}
          onChangeText={setPassword}
          onFocus={() => setFocusedField('password')}
          onBlur={() => setFocusedField('')}
          secureTextEntry={true}
          placeholder="••••••••"
          placeholderTextColor="#94a3b8"
        />

        {password.length > 0 && (
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
          <Text style={[styles.helperError, password.length > 0 && { marginTop: -8 }]}>
            {passwordDynamicError}
          </Text>
        ) : null}

        <Text style={styles.label}>Confirm Password <Text style={styles.required}>*</Text></Text>
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
        {passwordsMatch ? (
          <View style={styles.matchRow}>
            <Text style={styles.matchText}>Passwords match</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setIsAgreed(!isAgreed)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={isAgreed ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={24}
            color={isAgreed ? '#2563eb' : '#94a3b8'}
          />
          <Text style={styles.checkboxText}>
            I agree to the <Text style={styles.linkTextInline}>Terms of Service</Text> and <Text style={styles.linkTextInline}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryBtn, isSubmitDisabled && styles.primaryBtnDisabled]}
          onPress={handleRegister}
          disabled={isSubmitDisabled}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Create my account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => navigation.navigate('Login')}
          disabled={loading}
        >
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
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
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  spacing: {
    width: 12,
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
  matchText: { color: '#10b981', fontSize: 13, fontWeight: '500' },
  helperError: { color: '#ef4444', fontSize: 12, marginTop: -12, marginBottom: 16 },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  checkboxText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  linkTextInline: {
    color: '#2563eb',
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkBtn: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#2563eb', fontSize: 15, fontWeight: '600' },
});
