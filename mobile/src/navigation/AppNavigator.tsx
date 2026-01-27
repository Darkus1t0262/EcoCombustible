import React, { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { createStackNavigator } from '@react-navigation/stack';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';

import LoginScreen from '../screens/Auth/LoginScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import MapScreen from '../screens/Maps/MapScreen';
import AuditScreen from '../screens/Audit/AuditScreen';
import ReportsScreen from '../screens/Reports/ReportsScreen';
import StationListScreen from '../screens/Stations/StationListScreen';
import StationDetailScreen from '../screens/Stations/StationDetailScreen';
import ComplaintsScreen from '../screens/Complaints/ComplaintsScreen';
import ComplaintDetailScreen from '../screens/Complaints/ComplaintDetailScreen';
import VehicleListScreen from '../screens/Vehicles/VehicleListScreen';
import VehicleDetailScreen from '../screens/Vehicles/VehicleDetailScreen';
import TransactionListScreen from '../screens/Transactions/TransactionListScreen';
import TransactionDetailScreen from '../screens/Transactions/TransactionDetailScreen';
import LoadingScreen from '../screens/LoadingScreen';
import { USE_REMOTE_AUTH } from '../config/env';
import { initDatabase } from '../services/Database';
import { AuthService } from '../services/AuthService';
import { useTheme } from '../theme/theme';
import ChangePasswordScreen from '../screens/Auth/ChangePasswordScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { colors, resolvedMode } = useTheme();
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState('Login');
  const [initError, setInitError] = useState<string | null>(null);

  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      dark: resolvedMode === 'dark',
      colors: {
        ...DefaultTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.borderColor,
        notification: colors.error,
      },
    }),
    [colors, resolvedMode]
  );

  useEffect(() => {
    const load = async () => {
      try {
        if (!USE_REMOTE_AUTH) {
          await initDatabase();
        }
        const session = await AuthService.getSession();
        setInitialRoute(session ? 'Dashboard' : 'Login');
      } catch (error) {
        setInitError(USE_REMOTE_AUTH ? 'No se pudo iniciar la app.' : 'No se pudieron cargar los datos locales.');
      } finally {
        setIsReady(true);
      }
    };
    load();
  }, []);

  if (!isReady) {
    return <LoadingScreen label={USE_REMOTE_AUTH ? 'Cargando...' : 'Cargando datos locales...'} />;
  }

  if (initError) {
    return <LoadingScreen label={initError} />;
  }

  return (
    <>
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} backgroundColor="transparent" translucent />
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="StationList" component={StationListScreen} />
          <Stack.Screen name="StationDetail" component={StationDetailScreen} />
          <Stack.Screen name="Map" component={MapScreen} />
          <Stack.Screen name="Audit" component={AuditScreen} />
          <Stack.Screen name="Complaints" component={ComplaintsScreen} />
          <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} />
          <Stack.Screen name="VehicleList" component={VehicleListScreen} />
          <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
          <Stack.Screen name="TransactionList" component={TransactionListScreen} />
          <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{ title: 'Cambiar contraseña' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
