import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { requestWithFallback } from '../../config/api';
import { useListScreenHeader } from '../../hooks/useListScreenHeader';

export default function PaymentListScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useListScreenHeader(navigation, { addRoute: 'PaymentForm', addLabel: '＋ Add' });

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await requestWithFallback('/api/payments');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      if (json.success) setItems(json.data || []);
      else setError('Failed');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563eb" size="large" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{error}</Text>
        <TouchableOpacity style={styles.retry} onPress={load}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('PaymentDetail', { id: item._id })}
          >
            <Text style={styles.title}>
              ${item.amount} {item.currency || 'USD'}
            </Text>
            <Text style={styles.sub}>
              {item.method} · {item.status}
            </Text>
            <Text style={styles.meta}>
              {item.booking?.guestName ? `Booking: ${item.booking.guestName}` : 'No booking link'}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No payments.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f5fb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f2f5fb' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  sub: { fontSize: 14, color: '#64748b', marginTop: 4 },
  meta: { fontSize: 13, color: '#94a3b8', marginTop: 6 },
  err: { color: '#b91c1c', marginBottom: 12 },
  retry: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 40 },
});
