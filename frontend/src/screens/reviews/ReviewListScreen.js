import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { requestWithFallback } from '../../config/api';
import { useListScreenHeader } from '../../hooks/useListScreenHeader';
import { useAuth } from '../../context/AuthContext';
import { getTimeAgo } from '../../utils/timeago';

export default function ReviewListScreen({ navigation }) {
  const { currentUser, isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  useListScreenHeader(navigation, { addRoute: 'ReviewForm', addLabel: '+ Add' });

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await requestWithFallback('/api/reviews');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      if (json.success) setItems(json.data || []);
      else setError('Failed');
    } catch (e) {
      setError(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const stats = React.useMemo(() => {
    const total = items.length;
    const counts = [0, 0, 0, 0, 0]; // index 0 => 1-star, ... 4 => 5-star
    let sum = 0;
    items.forEach((it) => {
      const r = Number(it.rating) || 0;
      if (r >= 1 && r <= 5) {
        counts[r - 1] += 1;
        sum += r;
      }
    });
    const avg = total > 0 ? sum / total : 0;
    const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);
    return { total, counts, avg, pct };
  }, [items]);

  const openReviewActions = (item) => {
    const ownerId = item.user?._id || item.user;
    const canEdit = isAdmin || (currentUser && ownerId && String(currentUser._id) === String(ownerId));
    const buttons = [];
    if (canEdit) {
      buttons.push({ text: 'Edit', onPress: () => navigation.navigate('ReviewForm', { id: item._id }) });
      buttons.push({ text: 'Delete', style: 'destructive', onPress: () => confirmDelete(item) });
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });

    // If user cannot edit, menu will just show Cancel (card tap still opens details)
    Alert.alert('Review actions', canEdit ? 'Edit or delete your review.' : 'No actions available.', buttons);
  };

  const confirmDelete = (item) => {
    Alert.alert('Delete review', 'Are you sure you want to delete this review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(item._id);
          try {
            const res = await requestWithFallback(`/api/reviews/${item._id}`, { method: 'DELETE' });
            const json = await res.json();
            if (!res.ok) {
              Alert.alert('Error', json.message || 'Failed to delete');
              return;
            }
            setItems((prev) => prev.filter((i) => i._id !== item._id));
          } catch (e) {
            Alert.alert('Error', 'Network error');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#2563eb" size="large" /></View>;
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{error}</Text>
        <TouchableOpacity style={styles.retry} onPress={load}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{isAdmin ? 'Guest Feedback' : 'All Reviews'}</Text>
        <Text style={styles.heroSub}>{items.length} reviews</Text>

        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackTitle}>User Feedback</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.avgScore}>{stats.avg ? stats.avg.toFixed(1) : '0.0'}</Text>
            <View style={styles.starsRow}>
              {Array.from({ length: 5 }, (_, i) => {
                const filled = i < Math.round(stats.avg);
                return (
                  <Text key={i} style={[styles.star, filled && styles.starActive]}>{filled ? '★' : '☆'}</Text>
                );
              })}
            </View>
            <Text style={styles.totalCount}>{stats.total} ratings</Text>
          </View>

          <View style={styles.chart}>
            {[5,4,3,2,1].map((star) => {
              const count = stats.counts[star - 1] || 0;
              const percent = stats.pct(count);
              return (
                <View key={star} style={styles.barRow}>
                  <Text style={styles.barLabel}>{star}★</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${percent}%` }]} />
                  </View>
                  <Text style={styles.barCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const ownerId = item.user?._id || item.user;
          const canEdit = isAdmin || (currentUser && ownerId && String(currentUser._id) === String(ownerId));
          return (
            <View style={styles.card}>
              {canEdit ? (
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={(event) => {
                    event.stopPropagation();
                    openReviewActions(item);
                  }}
                >
                  <Text style={styles.menuIcon}>{deletingId === item._id ? '…' : '⋯'}</Text>
                </TouchableOpacity>
              ) : null}
              <Text style={styles.title}>{item.user?.name || 'User'}</Text>
              <Text style={styles.timeAgo}>{getTimeAgo(item.createdAt)}</Text>
              <Text style={styles.rating}>{'★'.repeat(Number(item.rating) || 0)}{'☆'.repeat(Math.max(0, 5 - (Number(item.rating) || 0)))}</Text>
              <Text style={styles.sub}>Room: {item.room?.roomNumber ? `#${item.room.roomNumber}` : '-'}</Text>
              <Text style={styles.sub}>Experience: {item.experience?.title || '-'}</Text>
              <Text style={styles.status}>{item.status}</Text>
              <Text style={styles.meta} numberOfLines={2}>{item.comment}</Text>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No reviews.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f4ee' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f4ee' },
  hero: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 6,
    borderRadius: 16,
    backgroundColor: '#ffe4e6',
    borderWidth: 1,
    borderColor: '#fecdd3',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#9f1239' },
  heroSub: { marginTop: 4, color: '#be123c', fontWeight: '600' },
  list: { padding: 16, paddingTop: 8 },
  card: { backgroundColor: '#fffdf8', padding: 16, paddingTop: 22, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#f3e8d7', position: 'relative' },
  menuButton: { position: 'absolute', top: 10, right: 10, width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#f8fafc' },
  menuIcon: { fontSize: 22, lineHeight: 22, color: '#475569', fontWeight: '900' },
  title: { fontSize: 17, fontWeight: '700', color: '#1f2937' },
  timeAgo: { fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: '600' },
  rating: { fontSize: 16, color: '#f59e0b', marginTop: 4, fontWeight: '800' },
  sub: { fontSize: 14, color: '#57534e', marginTop: 4 },
  status: { fontSize: 13, color: '#0f766e', marginTop: 4, fontWeight: '700' },
  meta: { fontSize: 13, color: '#0f766e', marginTop: 6, fontWeight: '700' },

  /* Feedback summary */
  feedbackCard: { marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6eef6' },
  feedbackTitle: { fontSize: 13, color: '#0f172a', fontWeight: '800', marginBottom: 8 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avgScore: { fontSize: 26, fontWeight: '900', color: '#0f172a' },
  starsRow: { flexDirection: 'row', marginLeft: 6 },
  star: { fontSize: 18, color: '#cbd5e1', marginHorizontal: 2 },
  starActive: { color: '#f59e0b' },
  totalCount: { marginLeft: 'auto', color: '#64748b', fontWeight: '700' },
  chart: { marginTop: 10 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  barLabel: { width: 36, color: '#475569', fontWeight: '700' },
  barTrack: { flex: 1, height: 10, backgroundColor: '#f1f5f9', borderRadius: 6, marginHorizontal: 10, overflow: 'hidden' },
  barFill: { height: 10, backgroundColor: '#60a5fa', borderRadius: 6 },
  barCount: { width: 28, textAlign: 'right', color: '#334155', fontWeight: '700' },
  err: { color: '#b91c1c', marginBottom: 12 },
  retry: { backgroundColor: '#0f766e', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#78716c', marginTop: 40 },
});
