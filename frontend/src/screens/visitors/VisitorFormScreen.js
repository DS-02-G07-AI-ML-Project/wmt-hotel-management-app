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

const STATUSES = ['On Premises', 'Checked Out'];

export default function VisitorFormScreen({ navigation, route }) {
  const editId = route.params?.id;
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [hostName, setHostName] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [status, setStatus] = useState('On Premises');

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const res = await requestWithFallback(`/api/visitors/${editId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const v = json.data;
          setFullName(v.fullName || '');
          setIdNumber(v.idNumber || '');
          setPhone(v.phone || '');
          setPurpose(v.purpose || '');
          setHostName(v.hostName || '');
          setCheckIn(v.checkIn ? String(v.checkIn).slice(0, 16).replace('T', ' ') : '');
          setCheckOut(v.checkOut ? String(v.checkOut).slice(0, 16).replace('T', ' ') : '');
          setBadgeNumber(v.badgeNumber || '');
          setStatus(v.status || 'On Premises');
        }
      } catch {
        Alert.alert('Error', 'Could not load');
      } finally {
        setLoading(false);
      }
    })();
  }, [editId]);

  const submit = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation', 'Full name is required.');
      return;
    }
    const payload = {
      fullName: fullName.trim(),
      idNumber: idNumber.trim(),
      phone: phone.trim(),
      purpose: purpose.trim(),
      hostName: hostName.trim(),
      checkIn: checkIn ? new Date(checkIn.replace(' ', 'T')).toISOString() : new Date().toISOString(),
      checkOut: checkOut.trim() ? new Date(checkOut.replace(' ', 'T')).toISOString() : null,
      badgeNumber: badgeNumber.trim(),
      status,
    };
    setSaving(true);
    try {
      const res = await requestWithFallback(
        editId ? `/api/visitors/${editId}` : '/api/visitors',
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
        Alert.alert('Saved', 'Visitor saved.');
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
      <Text style={styles.label}>Full name *</Text>
      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />

      <Text style={styles.label}>ID / Passport</Text>
      <TextInput style={styles.input} value={idNumber} onChangeText={setIdNumber} />

      <Text style={styles.label}>Phone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <Text style={styles.label}>Purpose</Text>
      <TextInput style={styles.input} value={purpose} onChangeText={setPurpose} />

      <Text style={styles.label}>Host name</Text>
      <TextInput style={styles.input} value={hostName} onChangeText={setHostName} />

      <Text style={styles.label}>Badge number</Text>
      <TextInput style={styles.input} value={badgeNumber} onChangeText={setBadgeNumber} />

      <Text style={styles.label}>Check-in (YYYY-MM-DD HH:mm)</Text>
      <TextInput style={styles.input} value={checkIn} onChangeText={setCheckIn} placeholder="2026-03-29 10:00" />

      <Text style={styles.label}>Check-out (optional)</Text>
      <TextInput style={styles.input} value={checkOut} onChangeText={setCheckOut} placeholder="2026-03-29 18:00" />

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
