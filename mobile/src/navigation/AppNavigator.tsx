import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import LoginScreen from '../screens/Auth/LoginScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import MapScreen from '../screens/Maps/MapScreen';
import AuditScreen from '../screens/Audit/AuditScreen';
import ReportsScreen from '../screens/Reports/ReportsScreen';
import StationListScreen from '../screens/Stations/StationListScreen';
import StationDetailScreen from '../screens/Stations/StationDetailScreen';
import ComplaintsScreen from '../screens/Complaints/ComplaintsScreen';
import ComplaintDetailScreen from '../screens/Complaints/ComplaintDetailScreen';
import LoadingScreen from '../screens/LoadingScreen';
import { initDatabase } from '../services/Database';
import { AuthService } from '../services/AuthService';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState('Login');
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        await initDatabase();
        const session = await AuthService.getSession();
        setInitialRoute(session ? 'Dashboard' : 'Login');
      } catch (error) {
        setInitError('Failed to load local data.');
      } finally {
        setIsReady(true);
      }
    };
    load();
  }, []);

  if (!isReady) {
    return <LoadingScreen label="Loading local data..." />;
  }

  if (initError) {
    return <LoadingScreen label={initError} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="StationList" component={StationListScreen} />
        <Stack.Screen name="StationDetail" component={StationDetailScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="Audit" component={AuditScreen} />
        <Stack.Screen name="Complaints" component={ComplaintsScreen} />
        <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} />
        <Stack.Screen name="Reports" component={ReportsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
