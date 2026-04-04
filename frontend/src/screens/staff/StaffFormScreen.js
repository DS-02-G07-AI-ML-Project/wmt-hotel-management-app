import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { requestWithFallback } from '../../config/api';

const STATUSES = ['Active', 'On Leave', 'Terminated'];

export default function StaffFormScreen({ navigation, route }) {
  const editId = route.params?.id;
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('General');
  const [hireDate, setHireDate] = useState('');
  const [status, setStatus] = useState('Active');

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const res = await requestWithFallback(`/api/staff/${editId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const s = json.data;
          setName(s.name || '');
          setEmail(s.email || '');
          setPhone(s.phone || '');
          setPosition(s.position || '');
          setDepartment(s.department || 'General');
          setHireDate(s.hireDate ? String(s.hireDate).slice(0, 10) : '');
          setStatus(s.status || 'Active');
        }
      } catch {
        Alert.alert('Error', 'Could not load');
      } finally {
        setLoading(false);
      }
    })();
  }, [editId]);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !position.trim()) {
      Alert.alert('Validation', 'Name, email and position are required.');
      return;
    }
    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      position: position.trim(),
      department: department.trim() || 'General',
      hireDate: hireDate ? new Date(hireDate).toISOString() : new Date().toISOString(),
      status,
    };
    setSaving(true);
    try {
      const res = await requestWithFallback(
        editId ? `/api/staff/${editId}` : '/api/staff',
        {
          method: editId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        Alert.alert('Error', json.message || 'Save failed');
        return;
      }
      if (json.success) {
        Alert.alert('Saved', 'Staff record saved.');
        navigation.goBack();
      }
    } catch {
      Alert.alert('Error', 'Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Email *</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Phone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <Text style={styles.label}>Position *</Text>
      <TextInput style={styles.input} value={position} onChangeText={setPosition} />

      <Text style={styles.label}>Department</Text>
      <TextInput style={styles.input} value={department} onChangeText={setDepartment} />

      <Text style={styles.label}>Hire date (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={hireDate} onChangeText={setHireDate} />

      <Text style={styles.label}>Status</Text>
      <View style={styles.row}>
        {STATUSES.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, status === s && styles.chipOn]}
            onPress={() => setStatus(s)}
          >
            <Text style={[styles.chipText, status === s && styles.chipTextOn]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

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
  label: { fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#e2e8f0' },
  chipOn: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 12, color: '#334155' },
  chipTextOn: { color: '#fff', fontWeight: '600' },
  save: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
