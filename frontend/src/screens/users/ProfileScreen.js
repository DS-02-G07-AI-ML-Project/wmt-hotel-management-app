import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { requestWithFallback } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { currentUser, token, logout } = useAuth();
  const [deleting, setDeleting] = useState(false);

  if (!currentUser) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>User not found</Text>
      </View>
    );
  }

  const getInitials = (name) =>
    name
      ?.split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await requestWithFallback('/api/users/me', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        if (Platform.OS === 'web') {
          window.alert('Your account has been deleted successfully.');
          await logout();
        } else {
          Alert.alert(
            'Account Deleted',
            'Your account has been deleted successfully.',
            [
              {
                text: 'OK',
                onPress: async () => {
                  try {
                    await logout();
                  } catch(e) {}
                }
              }
            ]
          );
        }
      } else {
        const json = await res.json().catch(() => ({}));
        Alert.alert('Error', json.message || 'Failed to delete account');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{getInitials(currentUser.name)}</Text>
        </View>
        <Text style={styles.name}>{currentUser.name}</Text>
        <Text style={styles.email}>{currentUser.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{currentUser.role.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Email</Text>
          <Text style={styles.detailValue}>{currentUser.email}</Text>
        </View>

        {currentUser.phone ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>{currentUser.phone}</Text>
          </View>
        ) : null}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Role</Text>
          <Text style={styles.detailValue}>{currentUser.role}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Member Since</Text>
          <Text style={styles.detailValue}>
            {new Date(currentUser.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.changePass}
        onPress={() => navigation.navigate('ChangePassword')}
      >
        <Text style={styles.changePassText}>Change Password</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteBtn}
        disabled={deleting}
        onPress={() => {
          if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to delete your account? This cannot be undone.')) {
              handleDeleteAccount();
            }
          } else {
            Alert.alert(
              'Delete Account',
              'Are you sure you want to delete your account? This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => handleDeleteAccount() },
              ]
            );
          }
        }}
      >
        {deleting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.deleteText}>Delete Account</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f5fb' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  err: { color: '#b91c1c' },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  initials: { fontSize: 32, fontWeight: '800', color: '#fff' },
  name: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  email: { fontSize: 14, color: '#64748b', marginBottom: 12 },
  roleBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  roleText: { color: '#1e40af', fontWeight: '600', fontSize: 12 },
  detailsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4 },
  detailValue: { fontSize: 15, color: '#0f172a', fontWeight: '500' },
  changePass: {
    backgroundColor: '#0369a1',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  changePassText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  deleteBtn: {
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
