import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { requestWithFallback } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { formatValidationMessage, isValidMongoId, isWholeNumberAtLeast } from '../../utils/validation';

const STATUSES = ['Visible', 'Hidden'];

export default function ReviewFormScreen({ navigation, route }) {
  const { currentUser, isAdmin } = useAuth();
  const editId = route.params?.id;
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [experiences, setExperiences] = useState([]);

  const [userId, setUserId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [experienceId, setExperienceId] = useState('');
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('Visible');

  useEffect(() => {
    (async () => {
      try {
        const [rRes, xRes] = await Promise.all([
          requestWithFallback('/api/rooms'),
          requestWithFallback('/api/experiences'),
        ]);
        const [rJson, xJson] = await Promise.all([rRes.json(), xRes.json()]);
        if (rJson.success) setRooms(rJson.data || []);
        if (xJson.success) setExperiences(xJson.data || []);
        if (isAdmin) {
          const uRes = await requestWithFallback('/api/users');
          const uJson = await uRes.json();
          if (uJson.success) setUsers(uJson.data || []);
        }
      } catch {
        // ignore
      }
    })();
  }, [isAdmin]);

  useEffect(() => {
    if (!editId && currentUser && !isAdmin) {
      setUserId(currentUser._id);
    }
  }, [editId, currentUser, isAdmin]);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const res = await requestWithFallback(`/api/reviews/${editId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const v = json.data;
          const ownerId = typeof v.user === 'object' ? v.user._id : v.user;
          if (!isAdmin && currentUser?._id && String(ownerId) !== String(currentUser._id)) {
            Alert.alert('Unauthorized', 'You can only edit your own reviews.');
            navigation.goBack();
            return;
          }
          setUserId(v.user && typeof v.user === 'object' ? v.user._id : v.user || '');
          setRoomId(v.room && typeof v.room === 'object' ? v.room._id : v.room || '');
          setExperienceId(v.experience && typeof v.experience === 'object' ? v.experience._id : v.experience || '');
          setRating(v.rating != null ? String(v.rating) : '5');
          setComment(v.comment || '');
          setStatus(v.status || 'Visible');
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
    const numericRating = Number(rating);

    if (!currentUser && !isAdmin) errors.user = 'You must be signed in to create a review.';
    if (isAdmin && !isValidMongoId(userId)) errors.user = 'Select a valid user.';
    if (roomId.trim() && !isValidMongoId(roomId)) errors.room = 'Select a valid room or leave it empty.';
    if (experienceId.trim() && !isValidMongoId(experienceId)) {
      errors.experience = 'Select a valid experience or leave it empty.';
    }
    if (!roomId.trim() && !experienceId.trim()) errors.target = 'Select a room or experience to review.';
    if (!isWholeNumberAtLeast(rating, 1) || numericRating > 5) errors.rating = 'Rating must be a whole number from 1 to 5.';
    if (comment.trim().length < 5) errors.comment = 'Comment must be at least 5 characters.';

    if (Object.keys(errors).length > 0) {
      Alert.alert('Validation', formatValidationMessage(errors));
      return;
    }

    if (!roomId.trim() && !experienceId.trim()) {
      Alert.alert('Validation', 'Select a room or an experience before saving the review.');
      return;
    }

    const payload = {
      user: isAdmin ? userId.trim() : currentUser?._id,
      room: roomId.trim() || null,
      experience: experienceId.trim() || null,
      rating: Number(rating),
      comment: comment.trim(),
      status,
    };

    if (!isAdmin && currentUser?._id) {
      payload.user = currentUser._id;
    }

    setSaving(true);
    try {
      const res = await requestWithFallback(editId ? `/api/reviews/${editId}` : '/api/reviews', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        Alert.alert('Error', json.message || 'Save failed');
        return;
      }
      Alert.alert('Saved', 'Review saved.');
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;

  const stars = Array.from({ length: 5 }, (_, index) => index + 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>{editId ? 'Edit review' : 'Create review'}</Text>
      <Text style={styles.subHeader}>Pick a room or experience, then add a rating and comment.</Text>

      {isAdmin ? (
        <>
          <Text style={styles.label}>User ID *</Text>
          <TextInput style={styles.input} value={userId} onChangeText={setUserId} placeholder="Mongo id" />
          {users.length > 0 ? (
            <View style={styles.row}>
              {users.slice(0, 6).map((u) => (
                <TouchableOpacity key={u._id} style={styles.chip} onPress={() => setUserId(u._id)}>
                  <Text style={styles.chipText}>{u.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </>
      ) : null}

      <Text style={styles.label}>Room ID (optional)</Text>
      <TextInput style={styles.input} value={roomId} onChangeText={setRoomId} />
      {rooms.length > 0 ? (
        <View style={styles.row}>
          {rooms.slice(0, 6).map((r) => (
            <TouchableOpacity key={r._id} style={styles.chip} onPress={() => setRoomId(r._id)}>
              <Text style={styles.chipText}>#{r.roomNumber}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <Text style={styles.label}>Experience ID (optional)</Text>
      <TextInput style={styles.input} value={experienceId} onChangeText={setExperienceId} />
      {experiences.length > 0 ? (
        <View style={styles.row}>
          {experiences.slice(0, 6).map((x) => (
            <TouchableOpacity key={x._id} style={styles.chip} onPress={() => setExperienceId(x._id)}>
              <Text style={styles.chipText}>{x.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <Text style={styles.label}>Rating *</Text>
      <View style={styles.starRow}>
        {stars.map((star) => {
          const active = Number(rating) >= star;
          return (
            <TouchableOpacity
              key={star}
              style={styles.starButton}
              onPress={() => setRating(String(star))}
              accessibilityRole="button"
              accessibilityLabel={`${star} star${star > 1 ? 's' : ''}`}
            >
              <Text style={[styles.star, active && styles.starActive]}>{active ? '★' : '☆'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.ratingHint}>{rating}/5</Text>

      <Text style={styles.label}>Comment *</Text>
      <TextInput style={[styles.input, styles.tall]} value={comment} onChangeText={setComment} multiline />

      {isAdmin ? (
        <>
          <Text style={styles.label}>Status</Text>
          <View style={styles.row}>
            {STATUSES.map((s) => (
              <TouchableOpacity key={s} style={[styles.chip, status === s && styles.chipOn]} onPress={() => setStatus(s)}>
                <Text style={[styles.chipText, status === s && styles.chipTextOn]}>{s}</Text>
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
  tall: { minHeight: 90, textAlignVertical: 'top' },
  starRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  starButton: { paddingVertical: 4, paddingRight: 8 },
  star: { fontSize: 28, color: '#cbd5e1' },
  starActive: { color: '#f59e0b' },
  ratingHint: { marginTop: 6, color: '#64748b', fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#e2e8f0' },
  chipOn: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 12, color: '#334155' },
  chipTextOn: { color: '#fff', fontWeight: '600' },
  save: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
