import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import RoomListScreen from './src/screens/RoomListScreen';
import AddRoomScreen from './src/screens/AddRoomScreen';
import RoomDetailScreen from './src/screens/RoomDetailScreen';
import EditRoomScreen from './src/screens/EditRoomScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Rooms"
        screenOptions={{
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
          headerTintColor: '#1f2937',
          cardStyle: styles.screen,
        }}
      >
        <Stack.Screen 
          name="Rooms" 
          component={RoomListScreen} 
          options={({ navigation }) => ({ 
            title: 'Available Rooms',
            headerRight: () => (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddRoom')}
              >
                <Text style={styles.addButtonText}>＋ Add Room</Text>
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen 
          name="AddRoom" 
          component={AddRoomScreen} 
          options={{ title: 'Add New Room' }} 
        />
        <Stack.Screen 
          name="RoomDetail" 
          component={RoomDetailScreen} 
          options={{ title: 'Room Details' }} 
        />
        <Stack.Screen 
          name="EditRoom" 
          component={EditRoomScreen} 
          options={{ title: 'Edit Room' }} 
        />
        {/* Additional screens (e.g., Login, Register) will be added here */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#f2f5fb',
  },
  header: {
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
});
