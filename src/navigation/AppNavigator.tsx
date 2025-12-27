import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

// Importación de Pantallas (Asegúrate que las rutas coincidan con tus carpetas)
import LoginScreen from '../screens/Auth/LoginScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import MapScreen from '../screens/Maps/MapScreen';
import AuditScreen from '../screens/Audit/AuditScreen';
import ReportsScreen from '../screens/Reports/ReportsScreen';
import StationListScreen from '../screens/Stations/StationListScreen';
import StationDetailScreen from '../screens/Stations/StationDetailScreen';
import ComplaintsScreen from '../screens/Complaints/ComplaintsScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        {/* Pantallas Principales */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        
        {/* Flujo de Estaciones (Lista -> Detalle -> Mapa) */}
        <Stack.Screen name="StationList" component={StationListScreen} />
        <Stack.Screen name="StationDetail" component={StationDetailScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        
        {/* Flujo de Control y Reportes */}
        <Stack.Screen name="Audit" component={AuditScreen} />
        <Stack.Screen name="Complaints" component={ComplaintsScreen} />
        <Stack.Screen name="Reports" component={ReportsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}