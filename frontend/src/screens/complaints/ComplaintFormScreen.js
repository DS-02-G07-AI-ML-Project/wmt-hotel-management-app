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

const CATS = ['Maintenance', 'Service', 'Noise', 'Other'];
const PRIOS = ['Low', 'Medium', 'High'];
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

export default function ComplaintFormScreen({ navigation, route }) {
  const editId = route.params?.id;
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [rooms, setRooms] = useState([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Open');
  const [reportedBy, setReportedBy] = useState('Guest');
  const [roomId, setRoomId] = useState('');

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
        const res = await requestWithFallback(`/api/complaints/${editId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const c = json.data;
          setTitle(c.title || '');
          setDescription(c.description || '');
          setCategory(c.category || 'Other');
          setPriority(c.priority || 'Medium');
          setStatus(c.status || 'Open');
          setReportedBy(c.reportedBy || 'Guest');
          setRoomId(c.room && typeof c.room === 'object' ? c.room._id : c.room || '');
        }
      } catch {
        Alert.alert('Error', 'Could not load');
      } finally {
        setLoading(false);
      }
    })();
  }, [editId]);

  const submit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Validation', 'Title and description are required.');
      return;
    }
    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status,
      reportedBy: reportedBy.trim() || 'Guest',
      room: roomId.trim() || null,
    };
    setSaving(true);
    try {
      const res = await requestWithFallback(
        editId ? `/api/complaints/${editId}` : '/api/complaints',
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
        Alert.alert('Saved', 'Complaint saved.');
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
      <Text style={styles.label}>Title *</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Description *</Text>
      <TextInput style={[styles.input, styles.tall]} value={description} onChangeText={setDescription} multiline />

      <Text style={styles.label}>Category</Text>
      <View style={styles.row}>
        {CATS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, category === c && styles.chipOn]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.chipText, category === c && styles.chipTextOn]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Priority</Text>
      <View style={styles.row}>
        {PRIOS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.chip, priority === p && styles.chipOn]}
            onPress={() => setPriority(p)}
          >
            <Text style={[styles.chipText, priority === p && styles.chipTextOn]}>{p}</Text>
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

      <Text style={styles.label}>Reported by</Text>
      <TextInput style={styles.input} value={reportedBy} onChangeText={setReportedBy} />

      <Text style={styles.label}>Room ID (optional)</Text>
      <TextInput style={styles.input} value={roomId} onChangeText={setRoomId} />
      {rooms.length > 0 ? (
        <View style={styles.row}>
          {rooms.slice(0, 8).map((r) => (
            <TouchableOpacity key={r._id} style={styles.chip} onPress={() => setRoomId(r._id)}>
              <Text style={styles.chipText}>#{r.roomNumber}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  tall: { minHeight: 100, textAlignVertical: 'top' },
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
