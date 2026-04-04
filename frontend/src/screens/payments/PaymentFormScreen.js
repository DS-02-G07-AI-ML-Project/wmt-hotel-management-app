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

const METHODS = ['Cash', 'Card', 'Bank', 'Online'];
const STATUSES = ['Pending', 'Completed', 'Failed', 'Refunded'];

export default function PaymentFormScreen({ navigation, route }) {
  const editId = route.params?.id;
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [bookings, setBookings] = useState([]);

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [method, setMethod] = useState('Cash');
  const [status, setStatus] = useState('Pending');
  const [reference, setReference] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [paidAt, setPaidAt] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await requestWithFallback('/api/bookings');
        const json = await res.json();
        if (json.success && json.data) setBookings(json.data);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const res = await requestWithFallback(`/api/payments/${editId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const p = json.data;
          setAmount(p.amount != null ? String(p.amount) : '');
          setCurrency(p.currency || 'USD');
          setMethod(p.method || 'Cash');
          setStatus(p.status || 'Pending');
          setReference(p.reference || '');
          setBookingId(
            p.booking && typeof p.booking === 'object' ? p.booking._id : p.booking || ''
          );
          setPaidAt(p.paidAt ? String(p.paidAt).slice(0, 16).replace('T', ' ') : '');
          setNotes(p.notes || '');
        }
      } catch {
        Alert.alert('Error', 'Could not load');
      } finally {
        setLoading(false);
      }
    })();
  }, [editId]);

  const submit = async () => {
    if (!amount || Number(amount) < 0) {
      Alert.alert('Validation', 'Valid amount required.');
      return;
    }
    const payload = {
      amount: Number(amount),
      currency: currency.trim() || 'USD',
      method,
      status,
      reference: reference.trim(),
      booking: bookingId.trim() || null,
      paidAt: paidAt ? new Date(paidAt.replace(' ', 'T')).toISOString() : new Date().toISOString(),
      notes: notes.trim(),
    };
    setSaving(true);
    try {
      const res = await requestWithFallback(
        editId ? `/api/payments/${editId}` : '/api/payments',
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
        Alert.alert('Saved', 'Payment saved.');
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
      <Text style={styles.label}>Amount *</Text>
      <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />

      <Text style={styles.label}>Currency</Text>
      <TextInput style={styles.input} value={currency} onChangeText={setCurrency} />

      <Text style={styles.label}>Method</Text>
      <View style={styles.row}>
        {METHODS.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.chip, method === m && styles.chipOn]}
            onPress={() => setMethod(m)}
          >
            <Text style={[styles.chipText, method === m && styles.chipTextOn]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

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

      <Text style={styles.label}>Reference</Text>
      <TextInput style={styles.input} value={reference} onChangeText={setReference} />

      <Text style={styles.label}>Booking ID (optional)</Text>
      <TextInput style={styles.input} value={bookingId} onChangeText={setBookingId} placeholder="Mongo id" />
      {bookings.length > 0 ? (
        <View style={styles.row}>
          {bookings.slice(0, 6).map((b) => (
            <TouchableOpacity key={b._id} style={styles.chip} onPress={() => setBookingId(b._id)}>
              <Text style={styles.chipText}>{b.guestName}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <Text style={styles.label}>Paid at (YYYY-MM-DD HH:mm)</Text>
      <TextInput style={styles.input} value={paidAt} onChangeText={setPaidAt} placeholder="2026-03-29 14:30" />

      <Text style={styles.label}>Notes</Text>
      <TextInput style={[styles.input, styles.tall]} value={notes} onChangeText={setNotes} multiline />

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
  tall: { minHeight: 72, textAlignVertical: 'top' },
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
