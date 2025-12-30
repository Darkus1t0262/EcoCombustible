import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { AuthService } from '../../services/AuthService';
import { StatsService } from '../../services/StatsService';

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
            <Ionicons name="gas-pump" size={20} color="white" />
          </View>
          <View>
            <Text style={styles.headerTitle}>EcoCombustible Regulador</Text>
            <Text style={styles.headerSub}>Supervision Dashboard</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={{ color: COLORS.error, fontWeight: 'bold' }}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.grid}>
          <MenuCard title="Stations" sub="List and status" icon="gas-pump" color={COLORS.primary} onPress={() => navigation.navigate('StationList')} />
          <MenuCard title="Map" sub="Geo view" icon="map" color={COLORS.success} onPress={() => navigation.navigate('Map')} />
          <MenuCard title="Audit" sub="Remote checks" icon="checkmark-circle" color={COLORS.warning} onPress={() => navigation.navigate('Audit')} />
          <MenuCard title="Complaints" sub="Reports" icon="alert-circle" color={COLORS.purple} onPress={() => navigation.navigate('Complaints')} />
          <MenuCard title="Reports" sub="Statistics" icon="stats-chart" color={COLORS.secondary} onPress={() => navigation.navigate('Reports')} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : (
          <View style={{ gap: 15, marginTop: 10 }}>
            <KPICard label="Active Stations" val={stats.stations} icon="gas-pump" color={COLORS.primary} />
            <KPICard label="Audits This Month" val={stats.auditsThisMonth} icon="checkmark-circle" color={COLORS.success} />
            <KPICard label="Pending Complaints" val={stats.pendingComplaints} icon="alert-circle" color={COLORS.error} />
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
