import { useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

/**
 * @param {boolean} options.showSignOut - default false (use Rooms tab to sign out)
 * @param {boolean} options.showProfile - default false (show profile icon)
 */
export function useListScreenHeader(navigation, options = {}) {
  const { logout, isAuthenticated, role } = useAuth();
  const { addRoute, addLabel = '+ Add', showSignOut = false, showProfile = false } = options;

  const handleProfilePress = () => {
    // Admin users: UsersTab exists in bottom nav
    if (role === 'admin') {
      navigation.navigate('UsersTab', { screen: 'Profile' });
    } else {
      // Non-admin users: Navigate directly to RoomsTab, then to Profile screen
      navigation.navigate('RoomsTab', { screen: 'Profile' });
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.row}>
          {isAuthenticated && showProfile ? (
            <TouchableOpacity onPress={handleProfilePress} hitSlop={8}>
              <Ionicons name="person-circle" size={28} color="#0f766e" />
            </TouchableOpacity>
          ) : null}
          {showSignOut ? (
            <TouchableOpacity onPress={logout} hitSlop={8} style={styles.textBtn}>
              <Text style={styles.muted}>Sign out</Text>
            </TouchableOpacity>
          ) : null}
          {addRoute ? (
            <TouchableOpacity style={styles.primary} onPress={() => navigation.navigate(addRoute)}>
              <Text style={styles.primaryText}>{addLabel}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ),
    });
  }, [navigation, logout, addRoute, addLabel, showSignOut, showProfile, isAuthenticated, role, handleProfilePress]);
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginRight: 8, gap: 8 },
  textBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#ffedd5',
  },
  muted: { color: '#9a3412', fontWeight: '700', fontSize: 12 },
  primary: {
    backgroundColor: '#0f766e',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    shadowColor: '#042f2e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
