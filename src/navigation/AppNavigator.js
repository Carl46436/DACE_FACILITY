// ============================================================
// App Navigator
// Main navigation structure with auth flow and tab navigation
// ============================================================

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth, AuthProvider } from '../stores/authStore';
import { ReportProvider } from '../stores/reportStore';
import { BorrowProvider } from '../stores/borrowStore';
import LoadingSpinner from '../components/LoadingSpinner';

// Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import RoleDashboardScreen from '../screens/RoleDashboardScreen';
import ReportSubmissionScreen from '../screens/ReportSubmissionScreen';
import ReportsListScreen from '../screens/ReportsListScreen';
import ReportDetailScreen from '../screens/ReportDetailScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import BorrowingScreen from '../screens/BorrowingScreen';
import AdminPanelScreen from '../screens/AdminPanelScreen';
import AdminItemsScreen from '../screens/AdminItemsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
  animation: 'slide_from_right',
};

/**
 * Auth stack - shown when user is NOT authenticated.
 */
const AuthStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
  </Stack.Navigator>
);

/**
 * Main app stack - shown when user IS authenticated.
 */
const AppStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="Dashboard" component={RoleDashboardScreen} />
    <Stack.Screen name="ReportSubmission" component={ReportSubmissionScreen} />
    <Stack.Screen name="ReportsList" component={ReportsListScreen} />
    <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
    <Stack.Screen name="QRScanner" component={QRScannerScreen} />
    <Stack.Screen name="Borrowing" component={BorrowingScreen} />
    <Stack.Screen name="AdminPanel" component={AdminPanelScreen} />
    <Stack.Screen name="AdminItems" component={AdminItemsScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
  </Stack.Navigator>
);

/**
 * Root navigator - handles auth state switching.
 */
const RootNavigator = () => {
  const { isAuthenticated, isInitialized, initialize } = useAuth();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized) {
    return <LoadingSpinner fullScreen message="Starting up..." />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

/**
 * App Navigator - wraps everything in providers.
 */
const AppNavigator = () => (
  <AuthProvider>
    <ReportProvider>
      <BorrowProvider>
        <RootNavigator />
      </BorrowProvider>
    </ReportProvider>
  </AuthProvider>
);

export default AppNavigator;
