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
import { useAuth } from '../../context/AuthContext';
import {
  formatValidationMessage,
  isPositiveNumber,
  isValidMongoId,
  parseDateInput,
} from '../../utils/validation';

const METHODS = ['Cash', 'Card', 'Bank', 'Online'];
const STATUSES = ['Pending', 'Completed', 'Failed', 'Refunded'];
const TEST_CARD = {
  name: 'Test Customer',
  number: '4242 4242 4242 4242',
  expiry: '12/30',
  cvc: '123',
};

const cardDigits = (value) => String(value || '').replace(/\D/g, '');
const maskCard = (value) => {
  const digits = cardDigits(value).slice(0, 19);
  return digits.replace(/(.{4})/g, '$1 ').trim();
};
const isValidExpiry = (value) => /^(0[1-9]|1[0-2])\/\d{2}$/.test(String(value || '').trim());

export default function PaymentFormScreen({ navigation, route }) {
  const { currentUser, isAdmin } = useAuth();
  const editId = route.params?.id;
  const selectedBookingId = route.params?.bookingId;
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [method, setMethod] = useState('Cash');
  const [status, setStatus] = useState('Pending');
  const [reference, setReference] = useState('');
  const [userId, setUserId] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [paidAt, setPaidAt] = useState('');
  const [notes, setNotes] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  useEffect(() => {
    if (!isAdmin && editId) {
      Alert.alert('Unauthorized', 'Only admins can edit payments.');
      navigation.goBack();
      return;
    }

    (async () => {
      try {
        const res = await requestWithFallback('/api/bookings');
        const json = await res.json();
        if (json.success && json.data) setBookings(json.data);
        if (isAdmin) {
          const userRes = await requestWithFallback('/api/users');
          const userJson = await userRes.json();
          if (userJson.success && userJson.data) setUsers(userJson.data);
        }
      } catch {
        /* ignore */
      }
    })();
  }, [isAdmin, editId]);

  useEffect(() => {
    if (!editId && currentUser && !isAdmin) {
      setUserId(currentUser._id);
    }
    if (!editId && selectedBookingId) {
      setBookingId(selectedBookingId);
    }
  }, [editId, currentUser, isAdmin, selectedBookingId]);

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
          setUserId(p.user && typeof p.user === 'object' ? p.user._id : p.user || '');
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
    const errors = {};
    const cardNumberDigits = cardDigits(cardNumber);
    const paidAtDate = paidAt ? parseDateInput(paidAt) : new Date();

    if (!isPositiveNumber(amount)) errors.amount = 'Amount must be greater than 0.';
    if (!isValidMongoId(bookingId)) errors.booking = 'Select a valid booking.';
    if (isAdmin && !isValidMongoId(userId)) errors.user = 'Select a valid user.';
    if (!paidAtDate) errors.paidAt = 'Paid at must be a valid date and time.';

    if (method === 'Card') {
      if (!cardName.trim()) {
        errors.cardName = 'Cardholder name is required.';
      }
      if (cardNumberDigits.length < 12) {
        errors.cardNumber = 'Enter a valid test card number.';
      }
      if (!isValidExpiry(cardExpiry)) {
        errors.cardExpiry = 'Card expiry must use MM/YY.';
      }
      if (cardDigits(cardCvc).length < 3) {
        errors.cardCvc = 'Card CVC is required.';
      }
    }

    if (Object.keys(errors).length > 0) {
      Alert.alert('Validation', formatValidationMessage(errors));
      return;
    }

    const generatedCardReference =
      method === 'Card' && !reference.trim()
        ? `TEST-CARD-${cardNumberDigits.slice(-4)}-${Date.now()}`
        : reference.trim();
    const cardNote =
      method === 'Card' ? `Test card ending ${cardNumberDigits.slice(-4)}` : '';

    const payload = {
      amount: Number(amount),
      currency: currency.trim() || 'USD',
      method,
      status,
      reference: generatedCardReference,
      user: isAdmin ? userId.trim() : currentUser?._id,
      booking: bookingId.trim() || null,
      paidAt: paidAtDate.toISOString(),
      notes: [notes.trim(), cardNote].filter(Boolean).join(' | '),
    };

    if (!isAdmin && currentUser?._id) {
      payload.user = currentUser._id;
    }
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
        navigation.navigate('PaymentsTab', { screen: 'PaymentList' });
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
      <Text style={styles.header}>{editId ? 'Edit payment' : 'Create payment'}</Text>
      <Text style={styles.subHeader}>Link a booking, choose a method, and record a safe payment reference.</Text>

      {isAdmin ? (
        <>
          <Text style={styles.label}>User ID *</Text>
          <TextInput style={styles.input} value={userId} onChangeText={setUserId} placeholder="Mongo id" />
          {users.length > 0 ? (
            <View style={styles.row}>
              {users.slice(0, 8).map((u) => (
                <TouchableOpacity key={u._id} style={styles.chip} onPress={() => setUserId(u._id)}>
                  <Text style={styles.chipText}>{u.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </>
      ) : null}

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

      {method === 'Card' ? (
        <View style={styles.cardBox}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Test card</Text>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => {
                setCardName(TEST_CARD.name);
                setCardNumber(TEST_CARD.number);
                setCardExpiry(TEST_CARD.expiry);
                setCardCvc(TEST_CARD.cvc);
              }}
            >
              <Text style={styles.testButtonText}>Fill test card</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Cardholder name *</Text>
          <TextInput style={styles.input} value={cardName} onChangeText={setCardName} />

          <Text style={styles.label}>Card number *</Text>
          <TextInput
            style={styles.input}
            value={cardNumber}
            onChangeText={(value) => setCardNumber(maskCard(value))}
            keyboardType="number-pad"
            maxLength={23}
            placeholder="4242 4242 4242 4242"
          />

          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <Text style={styles.label}>Expiry *</Text>
              <TextInput
                style={styles.input}
                value={cardExpiry}
                onChangeText={setCardExpiry}
                placeholder="12/30"
                maxLength={5}
              />
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>CVC *</Text>
              <TextInput
                style={styles.input}
                value={cardCvc}
                onChangeText={(value) => setCardCvc(cardDigits(value).slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
          </View>
        </View>
      ) : null}

      {isAdmin ? (
        <>
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
        </>
      ) : null}

      <Text style={styles.label}>Booking ID *</Text>
      <TextInput
        style={styles.input}
        value={bookingId}
        onChangeText={setBookingId}
        placeholder="Mongo id"
        editable={isAdmin || !selectedBookingId}
      />
      {bookings.length > 0 ? (
        <View style={styles.row}>
          {bookings.slice(0, 6).map((b) => (
            <TouchableOpacity key={b._id} style={styles.chip} onPress={() => setBookingId(b._id)}>
              <Text style={styles.chipText}>
                {b.user?.name ? `${b.user.name} · ` : ''}#{b.room?.roomNumber || 'booking'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {isAdmin ? (
        <>
          <Text style={styles.label}>Paid at (YYYY-MM-DD HH:mm)</Text>
          <TextInput style={styles.input} value={paidAt} onChangeText={setPaidAt} placeholder="2026-03-29 14:30" />
        </>
      ) : null}

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
  header: { fontSize: 25, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  subHeader: { color: '#64748b', marginBottom: 14 },
  label: { fontWeight: '700', color: '#334155', marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  tall: { minHeight: 72, textAlignVertical: 'top' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#e2e8f0' },
  chipOn: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 12, color: '#334155' },
  chipTextOn: { color: '#fff', fontWeight: '600' },
  cardBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e3a8a' },
  testButton: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  testButtonText: { color: '#1d4ed8', fontWeight: '700', fontSize: 12 },
  twoColumn: { flexDirection: 'row', gap: 10 },
  column: { flex: 1 },
  save: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
