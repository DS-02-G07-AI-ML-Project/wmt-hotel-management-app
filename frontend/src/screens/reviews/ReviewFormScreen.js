import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { requestWithFallback } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

const STATUSES = ['Visible', 'Hidden'];

const getRoomNumberValue = (roomNumber) => {
  const numberOnly = String(roomNumber || '').replace(/\D/g, '');
  return Number(numberOnly) || 0;
};

const sortRoomsByNumber = (roomsList) => {
  return [...roomsList].sort(
    (a, b) => getRoomNumberValue(a.roomNumber) - getRoomNumberValue(b.roomNumber)
  );
};

const sortExperiencesByDate = (experiencesList) => {
  return [...experiencesList].sort((a, b) => {
    const dateA = new Date(a.scheduleDate || a.date || a.eventDate || 0);
    const dateB = new Date(b.scheduleDate || b.date || b.eventDate || 0);
    return dateA - dateB;
  });
};

const getRoomLabel = (room) => {
  const roomNumber = room.roomNumber || 'Room';
  const roomType = room.type || room.roomType || 'Room';
  const price = Number(room.pricePerNight || room.price || room.pricePerMonth || 0);

  return `#${roomNumber} - ${roomType} Room - Rs. ${price}`;
};

const getExperienceLabel = (experience) => {
  const title = experience.title || experience.name || 'Experience';
  const rawDate = experience.scheduleDate || experience.date || experience.eventDate;
  const date = rawDate ? new Date(rawDate).toISOString().slice(0, 10) : 'No date';
  const price = Number(experience.price || 0);

  return `${title} - ${date} - Rs.${price}`;
};

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

  const selectedRoom = rooms.find((room) => String(room._id) === String(roomId));

  const selectedExperience = experiences.find(
    (experience) => String(experience._id) === String(experienceId)
  );

  const submit = async () => {
    if ((!isAdmin && !currentUser) || (!isAdmin && !comment.trim()) || (isAdmin && !userId.trim()) || !comment.trim()) {
      Alert.alert('Validation', isAdmin ? 'User and comment are required.' : 'Comment is required.');
      return;
    }

  const ratingValue = Number(rating);

    if (!ratingValue || ratingValue < 1 || ratingValue > 5) {
      Alert.alert('Validation', 'Rating must be between 1 and 5.');
      return;
    }

    const payload = {
      user: isAdmin ? userId.trim() : currentUser?._id,
      room: roomId.trim() || null,
      experience: experienceId.trim() || null,
      rating: ratingValue,
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isAdmin ? (
        <>
          <Text style={styles.label}>Select User *</Text>
          <TextInput style={styles.input} value={userId} onChangeText={setUserId} placeholder="Select user id" />
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

      <Text style={styles.label}>Select Room </Text>

        <View style={styles.selectedBox}>
          <Text style={styles.selectedText}>
            {selectedRoom ? getRoomLabel(selectedRoom) : 'No room selected'}
          </Text>
        </View>

        {rooms.length > 0 ? (
          <View style={styles.row}>
            {sortRoomsByNumber(rooms).map((r) => (
              <TouchableOpacity
                key={r._id}
                style={[
                  styles.chip,
                  String(roomId) === String(r._id) && styles.chipOn,
                ]}
                onPress={() => setRoomId(r._id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    String(roomId) === String(r._id) && styles.chipTextOn,
                  ]}
                >
                  {getRoomLabel(r)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {roomId ? (
          <TouchableOpacity onPress={() => setRoomId('')}>
            <Text style={styles.clearText}>Clear selected room</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.label}>Select Experience </Text>

        <View style={styles.selectedBox}>
          <Text style={styles.selectedText}>
            {selectedExperience ? getExperienceLabel(selectedExperience) : 'No experience selected'}
          </Text>
        </View>

        {experiences.length > 0 ? (
          <View style={styles.row}>
            {sortExperiencesByDate(experiences).map((x) => (
              <TouchableOpacity
                key={x._id}
                style={[
                  styles.chip,
                  String(experienceId) === String(x._id) && styles.chipOn,
                ]}
                onPress={() => setExperienceId(x._id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    String(experienceId) === String(x._id) && styles.chipTextOn,
                  ]}
                >
                  {getExperienceLabel(x)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {experienceId ? (
          <TouchableOpacity onPress={() => setExperienceId('')}>
            <Text style={styles.clearText}>Clear selected experience</Text>
          </TouchableOpacity>
        ) : null}
                    
       

      <Text style={styles.label}>Rating *</Text>

        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((value) => (
            <TouchableOpacity key={value} onPress={() => setRating(String(value))}>
              <Text style={styles.star}>
                {Number(rating) >= value ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      
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
  label: { fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 16 },
  tall: { minHeight: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  chip: {paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: '#e2e8f0', marginBottom: 4, },
  chipOn: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 12, color: '#334155', fontWeight: '500' },
  chipTextOn: { color: '#fff', fontWeight: '600' },
  save: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  selectedBox: {
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#e2e8f0',
  borderRadius: 10,
  padding: 12,
},

selectedText: {
  fontSize: 14,
  color: '#334155',
  fontWeight: '500',
},

clearText: {
  color: '#dc2626',
  fontSize: 13,
  fontWeight: '600',
  marginBottom: 8,
},

starRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginVertical: 8,
},

star: {
  fontSize: 34,
  color: '#f59e0b',
  marginRight: 6,
},
});
