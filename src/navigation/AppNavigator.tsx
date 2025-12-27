import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

// Importa tus pantallas
import LoginScreen from '../screens/Auth/LoginScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import MapScreen from '../screens/Maps/MapScreen';
import AuditScreen from '../screens/Audit/AuditScreen';
import ReportsScreen from '../screens/Reports/ReportsScreen';

// Placeholder rápido para pantallas que faltan crear archivo
const Placeholder = ({navigation}:any) => (
  <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
    <Text>En construcción</Text>
    <Text onPress={()=>navigation.goBack()} style={{color:'blue', marginTop:20}}>Volver</Text>
  </View>
);
import { View, Text } from 'react-native';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="Audit" component={AuditScreen} />
        <Stack.Screen name="Reports" component={ReportsScreen} />
        
        {/* Rutas pendientes de crear archivo individual */}
        <Stack.Screen name="StationList" component={Placeholder} />
        <Stack.Screen name="Complaints" component={Placeholder} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}