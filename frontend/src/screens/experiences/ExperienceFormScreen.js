import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { requestWithFallback } from '../../config/api';
import {
  formatValidationMessage,
  isPositiveNumber,
  isWholeNumberAtLeast,
  parseDateInput,
} from '../../utils/validation';

const CATEGORIES = ['Hiking', 'Cooking Class', 'Wellness', 'City Tour', 'Other'];
const STATUSES = ['Available', 'Sold Out', 'Cancelled'];

export default function ExperienceFormScreen({ navigation, route }) {
  const editId = route.params?.id;
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [price, setPrice] = useState('');
  const [durationHours, setDurationHours] = useState('1');
  const [capacity, setCapacity] = useState('1');
  const [scheduleDate, setScheduleDate] = useState('');
  const [status, setStatus] = useState('Available');

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const res = await requestWithFallback(`/api/experiences/${editId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const x = json.data;
          setTitle(x.title || '');
          setDescription(x.description || '');
          setCategory(x.category || 'Other');
          setPrice(x.price != null ? String(x.price) : '');
          setDurationHours(x.durationHours != null ? String(x.durationHours) : '1');
          setCapacity(x.capacity != null ? String(x.capacity) : '1');
          setScheduleDate(x.scheduleDate ? String(x.scheduleDate).slice(0, 16).replace('T', ' ') : '');
          setStatus(x.status || 'Available');
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
    const schedule = parseDateInput(scheduleDate);

    if (title.trim().length < 3) errors.title = 'Title must be at least 3 characters.';
    if (description.trim().length < 10) errors.description = 'Description must be at least 10 characters.';
    if (!isPositiveNumber(price)) errors.price = 'Price must be greater than 0.';
    if (!isWholeNumberAtLeast(durationHours, 1)) errors.duration = 'Duration must be at least 1 hour.';
    if (!isWholeNumberAtLeast(capacity, 1)) errors.capacity = 'Capacity must be at least 1.';
    if (!schedule) errors.scheduleDate = 'Enter a valid schedule date and time.';

    if (Object.keys(errors).length > 0) {
      Alert.alert('Validation', formatValidationMessage(errors));
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      price: Number(price),
      durationHours: Number(durationHours),
      capacity: Number(capacity),
      scheduleDate: schedule.toISOString(),
      status,
    };

    setSaving(true);
    try {
      const res = await requestWithFallback(editId ? `/api/experiences/${editId}` : '/api/experiences', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        Alert.alert('Error', json.message || 'Save failed');
        return;
      }
      Alert.alert('Saved', 'Experience saved.');
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
      <Text style={styles.header}>{editId ? 'Edit experience' : 'Create experience'}</Text>
      <Text style={styles.subHeader}>Add schedule, price, capacity, and availability details.</Text>

      <Text style={styles.label}>Title *</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Description *</Text>
      <TextInput style={[styles.input, styles.tall]} value={description} onChangeText={setDescription} multiline />

      <Text style={styles.label}>Category</Text>
      <View style={styles.row}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipOn]} onPress={() => setCategory(c)}>
            <Text style={[styles.chipText, category === c && styles.chipTextOn]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Price *</Text>
      <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />

      <Text style={styles.label}>Duration (hours)</Text>
      <TextInput style={styles.input} value={durationHours} onChangeText={setDurationHours} keyboardType="number-pad" />

      <Text style={styles.label}>Capacity</Text>
      <TextInput style={styles.input} value={capacity} onChangeText={setCapacity} keyboardType="number-pad" />

      <Text style={styles.label}>Schedule date (YYYY-MM-DD HH:mm) *</Text>
      <TextInput style={styles.input} value={scheduleDate} onChangeText={setScheduleDate} placeholder="2026-04-20 07:00" />

      <Text style={styles.label}>Status</Text>
      <View style={styles.row}>
        {STATUSES.map((s) => (
          <TouchableOpacity key={s} style={[styles.chip, status === s && styles.chipOn]} onPress={() => setStatus(s)}>
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
  header: { fontSize: 25, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  subHeader: { color: '#64748b', marginBottom: 14 },
  label: { fontWeight: '700', color: '#334155', marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 12, fontSize: 16 },
  tall: { minHeight: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#e2e8f0' },
  chipOn: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 12, color: '#334155' },
  chipTextOn: { color: '#fff', fontWeight: '600' },
  save: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
