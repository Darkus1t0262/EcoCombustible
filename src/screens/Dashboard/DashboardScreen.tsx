import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

const MenuCard = ({ title, sub, icon, color, onPress }: any) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={[styles.iconBox, { backgroundColor: color }]}>
      <Ionicons name={icon} size={28} color="white" />
    </View>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardSub}>{sub}</Text>
  </TouchableOpacity>
);

const KPICard = ({ label, val, icon, color }: any) => (
  <View style={styles.kpiContainer}>
    <View>
      <Text style={styles.kpiTitle}>{label}</Text>
      <Text style={[styles.kpiVal, { color }]}>{val}</Text>
    </View>
    <View style={[styles.kpiIcon, { backgroundColor: color }]}>
      <Ionicons name={icon} size={20} color="white" />
    </View>
  </View>
);

export default function DashboardScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{flexDirection:'row', alignItems:'center'}}>
           <View style={{backgroundColor:COLORS.primary, padding:8, borderRadius:8, marginRight:10}}>
             <Ionicons name="gas-pump" size={20} color="white"/>
           </View>
           <View>
             <Text style={styles.headerTitle}>EcoCombustible Regulador</Text>
             <Text style={styles.headerSub}>Panel de Supervisión</Text>
           </View>
        </View>
        <TouchableOpacity onPress={() => navigation.replace('Login')}>
           <Text style={{color: COLORS.error, fontWeight:'bold'}}>Salir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{padding: 20}}>
        {/* GRID */}
        <View style={styles.grid}>
          <MenuCard title="Estaciones" sub="Listado y estado" icon="gas-pump" color={COLORS.primary} onPress={() => navigation.navigate('StationList')} />
          <MenuCard title="Mapa" sub="Visualización Geo" icon="map" color={COLORS.success} onPress={() => navigation.navigate('Map')} />
          <MenuCard title="Auditoría" sub="Validación Remota" icon="checkmark-circle" color={COLORS.warning} onPress={() => navigation.navigate('Audit')} />
          <MenuCard title="Denuncias" sub="Reportes" icon="alert-circle" color={COLORS.purple} onPress={() => navigation.navigate('Complaints')} />
          <MenuCard title="Reportes" sub="Estadísticas" icon="stats-chart" color={COLORS.secondary} onPress={() => navigation.navigate('Reports')} />
        </View>

        {/* KPIs */}
        <View style={{gap: 15, marginTop: 10}}>
           <KPICard label="Estaciones Activas" val="1220" icon="gas-pump" color={COLORS.primary} />
           <KPICard label="Auditorías del Mes" val="160" icon="checkmark-circle" color={COLORS.success} />
           <KPICard label="Denuncias Pendientes" val="23" icon="alert-circle" color={COLORS.error} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, paddingTop: 50, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  headerSub: { fontSize: 12, color: '#666' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  card: { width: '48%', backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 15, elevation: 2 },
  iconBox: { width: 50, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontWeight: 'bold', fontSize: 14 },
  cardSub: { fontSize: 10, color: '#888' },
  kpiContainer: { backgroundColor: 'white', padding: 15, borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  kpiTitle: { fontSize: 14, color: '#333' },
  kpiVal: { fontSize: 18, fontWeight: 'bold', marginTop: 5 },
  kpiIcon: { padding: 8, borderRadius: 20 }
});