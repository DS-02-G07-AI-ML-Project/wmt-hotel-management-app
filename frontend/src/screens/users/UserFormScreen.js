import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { requestWithFallback } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { formatValidationMessage, isBlank, isValidEmail, isValidPhone } from '../../utils/validation';

const ROLES = ['customer', 'admin'];

export default function UserFormScreen({ navigation, route }) {
  const { isAdmin } = useAuth();
  const editId = route.params?.id;
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const res = await requestWithFallback(`/api/users/${editId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const u = json.data;
          setName(u.name || '');
          setEmail(u.email || '');
          setPhone(u.phone || '');
          setRole(u.role || 'customer');
        }
      } catch {
        Alert.alert('Error', 'Could not load user');
      } finally {
        setLoading(false);
      }
    })();
  }, [editId]);

  const submit = async () => {
    const errors = {};
    if (isBlank(name)) errors.name = 'Name is required.';
    else if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters.';
    if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
    if (!editId && password.length < 6) errors.password = 'Password must be at least 6 characters.';
    if (!isValidPhone(phone)) errors.phone = 'Phone must be 7-20 digits and may include +, spaces, or hyphens.';

    if (Object.keys(errors).length > 0) {
      Alert.alert('Validation', formatValidationMessage(errors));
      return;
    }

    const createPayload = {
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim(),
      role,
    };

    const updatePayload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
    };

    setSaving(true);
    try {
      const res = await requestWithFallback(editId ? `/api/users/${editId}` : '/api/users', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editId ? updatePayload : createPayload),
      });
      const json = await res.json();
      if (!res.ok) {
        Alert.alert('Error', json.message || 'Save failed');
        return;
      }
      Alert.alert('Saved', 'User saved.');
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>{editId ? 'Edit user' : 'Create user'}</Text>
      <Text style={styles.subHeader}>Set account details, contact information, and access role.</Text>

      <Text style={styles.label}>Name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Email *</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

      {!editId ? (
        <>
          <Text style={styles.label}>Password *</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
        </>
      ) : null}

      <Text style={styles.label}>Phone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      {isAdmin ? (
        <>
          <Text style={styles.label}>Role</Text>
          <View style={styles.row}>
            {ROLES.map((r) => (
              <TouchableOpacity key={r} style={[styles.chip, role === r && styles.chipOn]} onPress={() => setRole(r)}>
                <Text style={[styles.chipText, role === r && styles.chipTextOn]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : null}

      <TouchableOpacity style={styles.save} onPress={submit} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f5fb' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 25, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  subHeader: { color: '#64748b', marginBottom: 14 },
  label: { fontWeight: '700', color: '#334155', marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 12, fontSize: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#e2e8f0' },
  chipOn: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 12, color: '#334155' },
  chipTextOn: { color: '#fff', fontWeight: '600' },
  save: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
