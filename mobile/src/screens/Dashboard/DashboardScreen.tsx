import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { AuthService } from '../../services/AuthService';
import { StatsService } from '../../services/StatsService';

const MenuCard = ({ title, sub, icon, color, onPress }: any) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={[styles.iconBox, { backgroundColor: color }]}>
      {typeof icon === 'string' ? <Ionicons name={icon as any} size={28} color="white" /> : icon}
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
      {typeof icon === 'string' ? <Ionicons name={icon as any} size={20} color="white" /> : icon}
    </View>
  </View>
);

export default function DashboardScreen({ navigation }: any) {
  const [stats, setStats] = useState({ stations: 0, auditsThisMonth: 0, pendingComplaints: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await StatsService.getDashboardStats();
        setStats(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLogout = async () => {
    await AuthService.logout();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ backgroundColor: COLORS.primary, padding: 8, borderRadius: 8, marginRight: 10 }}>
            <MaterialCommunityIcons name="gas-station" size={20} color="white" />
          </View>
          <View>
            <Text style={styles.headerTitle}>EcoCombustible Regulador</Text>
            <Text style={styles.headerSub}>Panel de supervision</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={{ color: COLORS.error, fontWeight: 'bold' }}>Cerrar sesion</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.grid}>
          <MenuCard title="Estaciones" sub="Listado y estado" icon={<MaterialCommunityIcons name="gas-station" size={28} color="white" />} color={COLORS.primary} onPress={() => navigation.navigate('StationList')} />
          <MenuCard title="Mapa" sub="Vista geografica" icon="map" color={COLORS.success} onPress={() => navigation.navigate('Map')} />
          <MenuCard title="Auditorias" sub="Revision remota" icon="checkmark-circle" color={COLORS.warning} onPress={() => navigation.navigate('Audit')} />
          <MenuCard title="Denuncias" sub="Bandeja" icon="alert-circle" color={COLORS.purple} onPress={() => navigation.navigate('Complaints')} />
          <MenuCard title="Reportes" sub="Estadisticas" icon="stats-chart" color={COLORS.secondary} onPress={() => navigation.navigate('Reports')} />
          <MenuCard title="Vehiculos" sub="Registro" icon="car" color={COLORS.primary} onPress={() => navigation.navigate('VehicleList')} />
          <MenuCard title="Transacciones" sub="Consumo" icon="list" color={COLORS.success} onPress={() => navigation.navigate('TransactionList')} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : (
          <View style={{ gap: 15, marginTop: 10 }}>
            <KPICard label="Estaciones activas" val={stats.stations} icon={<MaterialCommunityIcons name="gas-station" size={20} color="white" />} color={COLORS.primary} />
            <KPICard label="Auditorias del mes" val={stats.auditsThisMonth} icon="checkmark-circle" color={COLORS.success} />
            <KPICard label="Denuncias pendientes" val={stats.pendingComplaints} icon="alert-circle" color={COLORS.error} />
          </View>
        )}
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
  kpiIcon: { padding: 8, borderRadius: 20 },
});
