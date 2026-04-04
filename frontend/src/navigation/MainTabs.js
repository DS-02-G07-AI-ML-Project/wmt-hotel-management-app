import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import RoomListScreen from '../screens/RoomListScreen';
import AddRoomScreen from '../screens/AddRoomScreen';
import RoomDetailScreen from '../screens/RoomDetailScreen';
import EditRoomScreen from '../screens/EditRoomScreen';

import BookingListScreen from '../screens/bookings/BookingListScreen';
import BookingDetailScreen from '../screens/bookings/BookingDetailScreen';
import BookingFormScreen from '../screens/bookings/BookingFormScreen';

import StaffListScreen from '../screens/staff/StaffListScreen';
import StaffDetailScreen from '../screens/staff/StaffDetailScreen';
import StaffFormScreen from '../screens/staff/StaffFormScreen';

import PaymentListScreen from '../screens/payments/PaymentListScreen';
import PaymentDetailScreen from '../screens/payments/PaymentDetailScreen';
import PaymentFormScreen from '../screens/payments/PaymentFormScreen';

import ComplaintListScreen from '../screens/complaints/ComplaintListScreen';
import ComplaintDetailScreen from '../screens/complaints/ComplaintDetailScreen';
import ComplaintFormScreen from '../screens/complaints/ComplaintFormScreen';

import VisitorListScreen from '../screens/visitors/VisitorListScreen';
import VisitorDetailScreen from '../screens/visitors/VisitorDetailScreen';
import VisitorFormScreen from '../screens/visitors/VisitorFormScreen';

const Tab = createBottomTabNavigator();
const RoomStack = createStackNavigator();
const BookingStack = createStackNavigator();
const StaffStack = createStackNavigator();
const PaymentStack = createStackNavigator();
const ComplaintStack = createStackNavigator();
const VisitorStack = createStackNavigator();

function RoomStackScreen() {
  return (
    <RoomStack.Navigator initialRouteName="Rooms" screenOptions={stackOptions}>
      <RoomStack.Screen name="Rooms" component={RoomListScreen} options={{ title: 'Rooms' }} />
      <RoomStack.Screen name="AddRoom" component={AddRoomScreen} options={{ title: 'Add Room' }} />
      <RoomStack.Screen name="RoomDetail" component={RoomDetailScreen} options={{ title: 'Room' }} />
      <RoomStack.Screen name="EditRoom" component={EditRoomScreen} options={{ title: 'Edit Room' }} />
    </RoomStack.Navigator>
  );
}

function BookingStackScreen() {
  return (
    <BookingStack.Navigator initialRouteName="BookingList" screenOptions={stackOptions}>
      <BookingStack.Screen name="BookingList" component={BookingListScreen} options={{ title: 'Bookings' }} />
      <BookingStack.Screen name="BookingDetail" component={BookingDetailScreen} />
      <BookingStack.Screen name="BookingForm" component={BookingFormScreen} options={{ title: 'Booking' }} />
    </BookingStack.Navigator>
  );
}

function StaffStackScreen() {
  return (
    <StaffStack.Navigator initialRouteName="StaffList" screenOptions={stackOptions}>
      <StaffStack.Screen name="StaffList" component={StaffListScreen} options={{ title: 'Staff' }} />
      <StaffStack.Screen name="StaffDetail" component={StaffDetailScreen} />
      <StaffStack.Screen name="StaffForm" component={StaffFormScreen} options={{ title: 'Staff member' }} />
    </StaffStack.Navigator>
  );
}

function PaymentStackScreen() {
  return (
    <PaymentStack.Navigator initialRouteName="PaymentList" screenOptions={stackOptions}>
      <PaymentStack.Screen name="PaymentList" component={PaymentListScreen} options={{ title: 'Payments' }} />
      <PaymentStack.Screen name="PaymentDetail" component={PaymentDetailScreen} />
      <PaymentStack.Screen name="PaymentForm" component={PaymentFormScreen} options={{ title: 'Payment' }} />
    </PaymentStack.Navigator>
  );
}

function ComplaintStackScreen() {
  return (
    <ComplaintStack.Navigator initialRouteName="ComplaintList" screenOptions={stackOptions}>
      <ComplaintStack.Screen name="ComplaintList" component={ComplaintListScreen} options={{ title: 'Complaints' }} />
      <ComplaintStack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} />
      <ComplaintStack.Screen name="ComplaintForm" component={ComplaintFormScreen} options={{ title: 'Complaint' }} />
    </ComplaintStack.Navigator>
  );
}

function VisitorStackScreen() {
  return (
    <VisitorStack.Navigator initialRouteName="VisitorList" screenOptions={stackOptions}>
      <VisitorStack.Screen name="VisitorList" component={VisitorListScreen} options={{ title: 'Visitors' }} />
      <VisitorStack.Screen name="VisitorDetail" component={VisitorDetailScreen} />
      <VisitorStack.Screen name="VisitorForm" component={VisitorFormScreen} options={{ title: 'Visitor' }} />
    </VisitorStack.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: { backgroundColor: '#ffffff', borderTopColor: '#e2e8f0' },
      }}
    >
      <Tab.Screen
        name="RoomsTab"
        component={RoomStackScreen}
        options={{
          title: 'Rooms',
          tabBarIcon: ({ color, size }) => <Ionicons name="bed" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="BookingsTab"
        component={BookingStackScreen}
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="StaffTab"
        component={StaffStackScreen}
        options={{
          title: 'Staff',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="PaymentsTab"
        component={PaymentStackScreen}
        options={{
          title: 'Pay',
          tabBarIcon: ({ color, size }) => <Ionicons name="card" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ComplaintsTab"
        component={ComplaintStackScreen}
        options={{
          title: 'Issues',
          tabBarIcon: ({ color, size }) => <Ionicons name="warning" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="VisitorsTab"
        component={VisitorStackScreen}
        options={{
          title: 'Visitors',
          tabBarIcon: ({ color, size }) => <Ionicons name="enter-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
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
});

const stackOptions = {
  headerStyle: styles.header,
  headerTitleStyle: styles.headerTitle,
  headerTintColor: '#1f2937',
  cardStyle: styles.screen,
};
