import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { requestWithFallback } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

const PASSWORD_REQUIREMENTS = [
  { regex: /.{6,}/, label: 'At least 6 characters' },
  { regex: /[A-Z]/, label: 'At least one uppercase letter' },
  { regex: /\d/, label: 'At least one number' },
  { regex: /[!@#$%^&*]/, label: 'At least one special character (!@#$%^&*)' },
];

export default function ChangePasswordScreen({ navigation }) {
  const { logout, updateToken } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const passwordRequirements = useMemo(() => {
    return PASSWORD_REQUIREMENTS.map(req => ({
      ...req,
      met: req.regex.test(newPassword),
    }));
  }, [newPassword]);

  const allRequirementsMet = passwordRequirements.every(req => req.met);

  const submit = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Validation', 'All fields are required');
      return;
    }

    if (!allRequirementsMet) {
      Alert.alert('Validation', 'Password does not meet all requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Validation', 'New passwords do not match');
      return;
    }

    setSaving(true);
    try {
      if (__DEV__) console.log('[ChangePassword] Attempting change for:', currentPassword ? '***' : 'empty');
      const res = await requestWithFallback('/api/users/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        }),
        skipAuth: false,
      });
      
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (__DEV__) console.error('[ChangePassword] Failed:', json.message);
        Alert.alert('Error', json.message || 'Failed to change password');
        setSaving(false);
        return;
      }

      if (__DEV__) console.log('[ChangePassword] Success');
      
      if (json.token) {
        await updateToken(json.token);
      }
      
      if (Platform.OS === 'web') {
        window.alert('Your password has been successfully updated.');
        navigation.goBack();
      } else {
        Alert.alert(
          'Password Changed Successfully',
          'Your password has been successfully updated.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              },
            },
          ]
        );
      }
    } catch (err) {
      if (__DEV__) console.error('[ChangePassword] Network error:', err.message);
      Alert.alert('Error', 'Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Current Password *</Text>
      <TextInput
        style={styles.input}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        placeholder="Enter your current password"
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>New Password *</Text>
      <TextInput
        style={styles.input}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        placeholder="Enter new password"
        placeholderTextColor="#999"
      />

      <View style={styles.requirements}>
        {PASSWORD_REQUIREMENTS.map((req) => {
          const isMet = req.regex.test(newPassword);
          return (
            <View key={req.label} style={styles.requirementRow}>
              <Text style={[styles.requirementIcon, isMet && styles.requirementMet]}>
                {isMet ? '✓' : '○'}
              </Text>
              <Text style={[styles.requirementText, isMet && styles.requirementMetText]}>
                {req.label}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.label}>Confirm New Password *</Text>
      <TextInput
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholder="Confirm new password"
        placeholderTextColor="#999"
      />

      {newPassword && confirmPassword && newPassword !== confirmPassword ? (
        <Text style={styles.mismatchError}>Passwords do not match</Text>
      ) : null}

      <TouchableOpacity
        style={[styles.save, (!allRequirementsMet || !confirmPassword) && styles.saveDisabled]}
        onPress={submit}
        disabled={saving || !allRequirementsMet || !confirmPassword}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Change Password</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f5fb' },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 16 },
  requirements: { marginTop: 12, marginBottom: 16, backgroundColor: '#f0f9ff', padding: 12, borderRadius: 8 },
  requirementRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  requirementIcon: { fontSize: 16, fontWeight: '700', color: '#cbd5e1', marginRight: 8, width: 20 },
  requirementMet: { color: '#10b981' },
  requirementText: { fontSize: 13, color: '#64748b' },
  requirementMetText: { color: '#10b981', fontWeight: '600' },
  mismatchError: { color: '#dc2626', fontSize: 12, marginTop: 8, marginBottom: 8 },
  save: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  saveDisabled: { opacity: 0.5 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
