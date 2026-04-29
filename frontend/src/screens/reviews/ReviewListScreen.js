import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { requestWithFallback } from '../../config/api';
import { useListScreenHeader } from '../../hooks/useListScreenHeader';
import { useAuth } from '../../context/AuthContext';

const getStars = (rating) => {
  const value = Number(rating) || 0;
  return '★'.repeat(value) + '☆'.repeat(5 - value);
};

const getRoomNumber = (room) => {
  if (!room) return null;

  if (typeof room === 'object') {
    return room.roomNumber || room.number || null;
  }

  return null;
};

const getExperienceName = (experience) => {
  if (!experience) return null;

  if (typeof experience === 'object') {
    return experience.title || experience.name || null;
  }

  return null;
};

const canManageReview = (item, isAdmin, currentUser) => {
  if (isAdmin) return true;

  const ownerId =
    item.user && typeof item.user === 'object' ? item.user._id : item.user;

  return String(ownerId) === String(currentUser?._id);
};

const getTimeAgo = (dateValue) => {
  if (!dateValue) return '';

  const diff = Date.now() - new Date(dateValue).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
};

export default function ReviewListScreen({ navigation }) {
  const { isAdmin, currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRating, setSelectedRating] = useState('All');

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

  const deleteReview = async (id) => {
  try {
    const res = await requestWithFallback(`/api/reviews/${id}`, {
      method: 'DELETE',
    });

    const json = await res.json();

    if (!res.ok) {
      Alert.alert('Error', json.message || 'Delete failed');
      return;
    }

    Alert.alert('Deleted', 'Review deleted successfully.');
    load();
  } catch {
    Alert.alert('Error', 'Network error');
  }
};

const openReviewActions = (item) => {
  Alert.alert('Review Actions', 'Choose an action', [
    {
      text: 'Edit',
      onPress: () => navigation.navigate('ReviewForm', { id: item._id }),
    },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: () =>
        Alert.alert('Delete Review', 'Are you sure you want to delete this review?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteReview(item._id),
          },
        ]),
    },
    { text: 'Cancel', style: 'cancel' },
  ]);
};

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filteredItems =
  selectedRating === 'All'
    ? items
    : items.filter((item) => Number(item.rating) === Number(selectedRating));

  const averageRating =
    items.length > 0
      ? (items.reduce((sum, item) => sum + Number(item.rating || 0), 0) / items.length).toFixed(1)
      : '0.0';

  const getRatingCount = (rating) =>
    items.filter((item) => Number(item.rating) === rating).length;

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
        <Text style={styles.heroTitle}>Ratings & Reviews</Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.averageBox}>
          <Text style={styles.averageText}>{averageRating}</Text>
          <Text style={styles.stars}>{getStars(Math.round(Number(averageRating)))}</Text>
          <Text style={styles.reviewCount}>({items.length} reviews)</Text>
        </View>

        <View style={styles.barBox}>
          {[5, 4, 3, 2, 1].map((rating) => (
            <View key={rating} style={styles.barRow}>
              <Text style={styles.barLabel}>{rating}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${items.length ? (getRatingCount(rating) / items.length) * 100 : 0}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.filterRow}>
        {['All', 5, 4, 3, 2, 1].map((rating) => (
          <TouchableOpacity
            key={rating}
            style={[
              styles.filterChip,
              selectedRating === rating && styles.filterChipActive,
            ]}
            onPress={() => setSelectedRating(rating)}
          >
            <Text
              style={[
                styles.filterText,
                selectedRating === rating && styles.filterTextActive,
              ]}
            >
              {rating === 'All' ? '★ All' : `★ ${rating}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}

        renderItem={({ item }) => {
          const roomNumber = getRoomNumber(item.room);
          const experienceName = getExperienceName(item.experience);
          const showMenu = canManageReview(item, isAdmin, currentUser);

          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={styles.userRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(item.user?.name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.userInfo}>
                    <Text style={styles.title}>{item.user?.name || 'User'}</Text>
                    <Text style={styles.timeText}>
                      {getTimeAgo(item.createdAt || item.updatedAt)}
                    </Text>
                  </View>
                </View>

                <View style={styles.rightHeader}>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>★ {item.rating}</Text>
                  </View>

                  {showMenu ? (
                    <TouchableOpacity
                      style={styles.menuBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        openReviewActions(item);
                      }}
                    >
                      <Text style={styles.menuText}>⋯</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {roomNumber ? <Text style={styles.sub}>Room #{roomNumber}</Text> : null}

              {experienceName ? (
                <Text style={styles.sub}>Experience: {experienceName}</Text>
              ) : null}

              <Text style={styles.sub}>{item.status}</Text>

              <Text style={styles.meta} numberOfLines={3}>
                {item.comment}
              </Text>
            </TouchableOpacity>
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
  list: { padding: 16, paddingTop: 8 },
  card: { backgroundColor: '#fffdf8', padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#f3e8d7' },
  title: { fontSize: 17, fontWeight: '700', color: '#1f2937' },
  sub: { fontSize: 14, color: '#57534e', marginTop: 4 },
  meta: { fontSize: 13, color: '#0f766e', marginTop: 6, fontWeight: '700' },
  err: { color: '#b91c1c', marginBottom: 12 },
  retry: { backgroundColor: '#0f766e', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#78716c', marginTop: 40 },
 
  summaryCard: {
  backgroundColor: '#fffdf8',
  borderRadius: 18,
  padding: 16,
  marginHorizontal: 16,
  marginTop: 12,
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#f3e8d7',
},

averageBox: {
  width: 110,
  alignItems: 'center',
  borderRightWidth: 1,
  borderRightColor: '#e5e7eb',
  paddingRight: 12,
},

averageText: {
  fontSize: 42,
  fontWeight: '800',
  color: '#111827',
},

stars: {
  color: '#f59e0b',
  fontSize: 18,
  fontWeight: '700',
},

reviewCount: {
  fontSize: 12,
  color: '#6b7280',
  marginTop: 4,
},

barBox: {
  flex: 1,
  paddingLeft: 14,
},

barRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 8,
},

barLabel: {
  width: 16,
  fontSize: 12,
  color: '#111827',
},

barTrack: {
  flex: 1,
  height: 5,
  borderRadius: 10,
  backgroundColor: '#e5e7eb',
},

barFill: {
  height: 5,
  borderRadius: 10,
  backgroundColor: '#f59e0b',
},

filterRow: {
  flexDirection: 'row',
  paddingHorizontal: 16,
  marginTop: 14,
  marginBottom: 6,
  gap: 8,
  flexWrap: 'wrap',
},

filterChip: {
  borderWidth: 1,
  borderColor: '#f59e0b',
  borderRadius: 20,
  paddingVertical: 7,
  paddingHorizontal: 14,
  backgroundColor: '#fffdf8',
},

filterChipActive: {
  backgroundColor: '#f59e0b',
},

filterText: {
  color: '#f59e0b',
  fontWeight: '700',
},

filterTextActive: {
  color: '#fff',
},

cardHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
},

userRow: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
},

avatar: {
  width: 38,
  height: 38,
  borderRadius: 19,
  backgroundColor: '#fde68a',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 10,
},

avatarText: {
  fontWeight: '800',
  color: '#92400e',
},

userInfo: {
  flex: 1,
},

timeText: {
  fontSize: 12,
  color: '#78716c',
  marginTop: 2,
},

rightHeader: {
  flexDirection: 'row',
  alignItems: 'center',
},

ratingBadge: {
  borderWidth: 1,
  borderColor: '#f59e0b',
  borderRadius: 18,
  paddingHorizontal: 12,
  paddingVertical: 5,
  marginRight: 8,
},

ratingText: {
  color: '#f59e0b',
  fontWeight: '800',
  fontSize: 13,
},

menuBtn: {
  width: 28,
  height: 28,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: '#d6d3d1',
  alignItems: 'center',
  justifyContent: 'center',
},

menuText: {
  fontSize: 20,
  color: '#44403c',
  fontWeight: '700',
  marginTop: -6,
},

});
