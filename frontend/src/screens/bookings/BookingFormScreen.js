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

const STATUSES = ['pending', 'confirmed', 'checked_in', 'cancelled', 'completed'];

export default function BookingFormScreen({ navigation, route }) {
  const editId = route.params?.id;
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [rooms, setRooms] = useState([]);

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [roomId, setRoomId] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [status, setStatus] = useState('pending');
  const [notes, setNotes] = useState('');
  const [totalAmount, setTotalAmount] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await requestWithFallback('/api/rooms');
        const json = await res.json();
        if (json.success && json.data) setRooms(json.data);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const res = await requestWithFallback(`/api/bookings/${editId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const b = json.data;
          setGuestName(b.guestName || '');
          setGuestEmail(b.guestEmail || '');
          setGuestPhone(b.guestPhone || '');
          setRoomId(typeof b.room === 'object' ? b.room._id : b.room || '');
          setCheckIn(b.checkIn ? String(b.checkIn).slice(0, 10) : '');
          setCheckOut(b.checkOut ? String(b.checkOut).slice(0, 10) : '');
          setStatus(b.status || 'pending');
          setNotes(b.notes || '');
          setTotalAmount(b.totalAmount != null ? String(b.totalAmount) : '');
        }
      } catch {
        Alert.alert('Error', 'Could not load booking');
      } finally {
        setLoading(false);
      }
    })();
  }, [editId]);

  const submit = async () => {
    if (!guestName.trim() || !roomId || !checkIn || !checkOut) {
      Alert.alert('Validation', 'Name, room, check-in and check-out are required.');
      return;
    }
    const payload = {
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      guestPhone: guestPhone.trim(),
      room: roomId,
      checkIn: new Date(checkIn).toISOString(),
      checkOut: new Date(checkOut).toISOString(),
      status,
      notes: notes.trim(),
      totalAmount: totalAmount ? Number(totalAmount) : 0,
    };
    setSaving(true);
    try {
      const res = await requestWithFallback(
        editId ? `/api/bookings/${editId}` : '/api/bookings',
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
        Alert.alert('Saved', 'Booking saved.');
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
      <Text style={styles.label}>Guest name *</Text>
      <TextInput style={styles.input} value={guestName} onChangeText={setGuestName} />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={guestEmail}
        onChangeText={setGuestEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Phone</Text>
      <TextInput style={styles.input} value={guestPhone} onChangeText={setGuestPhone} keyboardType="phone-pad" />

      <Text style={styles.label}>Room * (pick room id)</Text>
      <TextInput style={styles.input} value={roomId} onChangeText={setRoomId} placeholder="Room MongoDB id" />
      <Text style={styles.hint}>Available rooms loaded: tap an id from the list or paste from room detail.</Text>
      {rooms.length > 0 ? (
        <View style={styles.roomPick}>
          {rooms.slice(0, 8).map((r) => (
            <TouchableOpacity key={r._id} style={styles.chip} onPress={() => setRoomId(r._id)}>
              <Text style={styles.chipText}>
                #{r.roomNumber} ({r.type})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <Text style={styles.label}>Check-in * (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={checkIn} onChangeText={setCheckIn} placeholder="2026-04-01" />

      <Text style={styles.label}>Check-out * (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={checkOut} onChangeText={setCheckOut} placeholder="2026-04-03" />

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

      <Text style={styles.label}>Total amount</Text>
      <TextInput style={styles.input} value={totalAmount} onChangeText={setTotalAmount} keyboardType="decimal-pad" />

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
  tall: { minHeight: 80, textAlignVertical: 'top' },
  hint: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  roomPick: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
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
