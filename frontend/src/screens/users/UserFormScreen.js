import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { requestWithFallback } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

const ROLES = ['customer', 'admin'];

export default function UserFormScreen({ navigation, route }) {
  const { isAdmin } = useAuth();
  const editId = route.params?.id;
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const res = await requestWithFallback(`/api/users/${editId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const u = json.data;
          setName(u.name || '');
          setEmail(u.email || '');
          setPhone(u.phone || '');
          setRole(u.role || 'customer');
        }
      } catch {
        Alert.alert('Error', 'Could not load user');
      } finally {
        setLoading(false);
      }
    })();
  }, [editId]);

  const submit = async () => {
    if (!name.trim() || !email.trim() || (!editId && password.length < 6)) {
      Alert.alert('Validation', 'Name and email are required. New users need password (min 6).');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Validation', 'Please enter a valid email address.');
      return;
    }

    const createPayload = {
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim(),
      role,
    };

    const updatePayload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
    };

    setSaving(true);
    try {
      const res = await requestWithFallback(editId ? `/api/users/${editId}` : '/api/users', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editId ? updatePayload : createPayload),
      });
      const json = await res.json();
      if (!res.ok) {
        Alert.alert('Error', json.message || 'Save failed');
        return;
      }
      
      const successMsg = json.message || (editId ? 'User updated successfully.' : 'User created successfully.');
      
      if (Platform.OS === 'web') {
        window.alert(successMsg);
        navigation.goBack();
      } else {
        Alert.alert('Success', successMsg, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch {
      Alert.alert('Error', 'Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Email *</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

      {!editId ? (
        <>
          <Text style={styles.label}>Password *</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
        </>
      ) : null}

      <Text style={styles.label}>Phone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      {isAdmin ? (
        <View style={styles.roleSection}>
          <Text style={styles.label}>Account Role</Text>
          <View style={styles.roleContainer}>
            {ROLES.map((r) => {
              const isActive = role === r;
              const iconName = r === 'admin' ? 'shield-account' : 'account';
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleButton, isActive && styles.roleButtonActive]}
                  onPress={() => setRole(r)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons 
                    name={iconName} 
                    size={20} 
                    color={isActive ? '#fff' : '#64748b'} 
                  />
                  <Text style={[styles.roleButtonText, isActive && styles.roleButtonTextActive]}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 16, color: '#1e293b' },
  roleSection: { marginTop: 16, marginBottom: 8 },
  roleContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, gap: 4 },
  roleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 8 },
  roleButtonActive: { backgroundColor: '#2563eb', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  roleButtonText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  roleButtonTextActive: { color: '#fff' },
  save: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 32, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
});
