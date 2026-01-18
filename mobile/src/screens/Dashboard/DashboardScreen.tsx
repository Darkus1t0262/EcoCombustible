import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { AuthService } from '../../services/AuthService';
import { StatsService } from '../../services/StatsService';

const titleFont = Platform.select({ ios: 'Avenir Next', android: 'serif' });

const MenuCard = ({ title, sub, icon, color, onPress }: any) => (
  <TouchableOpacity style={styles.menuCard} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.menuHeaderRow}>
      <View style={[styles.menuIcon, { backgroundColor: `${color}1A`, borderColor: `${color}40` }]}
      >
        {typeof icon === 'string' ? <Ionicons name={icon as any} size={24} color={color} /> : icon}
      </View>
      <Ionicons name="arrow-forward" size={16} color={COLORS.textLight} />
    </View>
    <Text style={styles.menuTitle}>{title}</Text>
    <Text style={styles.menuSub}>{sub}</Text>
  </TouchableOpacity>
);

const KPICard = ({ label, val, icon, color }: any) => (
  <View style={styles.kpiCard}>
    <View style={[styles.kpiIcon, { backgroundColor: `${color}1A`, borderColor: `${color}33` }]}
    >
      {typeof icon === 'string' ? <Ionicons name={icon as any} size={18} color={color} /> : icon}
    </View>
    <View style={styles.kpiBody}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color }]}>{val}</Text>
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroGlowAlt} />

          <View style={styles.heroTop}>
            <View style={styles.brandRow}>
              <View style={styles.brandIcon}>
                <MaterialCommunityIcons name="gas-station" size={22} color={COLORS.white} />
              </View>
              <View>
                <Text style={styles.heroTitle}>EcoCombustible</Text>
                <Text style={styles.heroSubtitle}>Control inteligente del subsidio</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={16} color={COLORS.error} />
              <Text style={styles.logoutText}>Salir</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Monitoreo nacional en tiempo real</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Acciones rápidas</Text>
        <View style={styles.grid}>
          <MenuCard
            title="Estaciones"
            sub="Listado y estado"
            icon={<MaterialCommunityIcons name="gas-station" size={24} color={COLORS.primary} />}
            color={COLORS.primary}
            onPress={() => navigation.navigate('StationList')}
          />
          <MenuCard
            title="Mapa"
            sub="Vista geográfica"
            icon="map"
            color={COLORS.success}
            onPress={() => navigation.navigate('Map')}
          />
          <MenuCard
            title="Auditorías"
            sub="Revisión remota"
            icon="checkmark-circle"
            color={COLORS.warning}
            onPress={() => navigation.navigate('Audit')}
          />
          <MenuCard
            title="Denuncias"
            sub="Bandeja"
            icon="alert-circle"
            color={COLORS.purple}
            onPress={() => navigation.navigate('Complaints')}
          />
          <MenuCard
            title="Reportes"
            sub="Estadísticas"
            icon="stats-chart"
            color={COLORS.secondary}
            onPress={() => navigation.navigate('Reports')}
          />
          <MenuCard
            title="Vehículos"
            sub="Registro"
            icon="car"
            color={COLORS.primary}
            onPress={() => navigation.navigate('VehicleList')}
          />
          <MenuCard
            title="Transacciones"
            sub="Consumo"
            icon="list"
            color={COLORS.success}
            onPress={() => navigation.navigate('TransactionList')}
          />
        </View>

        <Text style={styles.sectionTitle}>Resumen</Text>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 10 }} />
        ) : (
          <View style={styles.kpiGrid}>
            <KPICard
              label="Estaciones activas"
              val={stats.stations}
              icon={<MaterialCommunityIcons name="gas-station" size={18} color={COLORS.primary} />}
              color={COLORS.primary}
            />
            <KPICard
              label="Auditorías del mes"
              val={stats.auditsThisMonth}
              icon="checkmark-circle"
              color={COLORS.success}
            />
            <KPICard
              label="Denuncias pendientes"
              val={stats.pendingComplaints}
              icon="alert-circle"
              color={COLORS.error}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: 30 },
  hero: {
    margin: 20,
    padding: 18,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: `${COLORS.primary}22`,
    top: -40,
    right: -60,
  },
  heroGlowAlt: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: `${COLORS.success}1A`,
    bottom: -30,
    left: -40,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  heroTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, fontFamily: titleFont },
  heroSubtitle: { fontSize: 12, color: COLORS.textLight },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${COLORS.error}33`,
    backgroundColor: `${COLORS.error}12`,
  },
  logoutText: { color: COLORS.error, fontWeight: '600', fontSize: 12 },
  heroBadge: {
    marginTop: 16,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceAlt,
  },
  heroBadgeText: { fontSize: 11, color: COLORS.textLight, fontWeight: '600' },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
    fontFamily: titleFont,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20 },
  menuCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  menuHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: { marginTop: 10, fontWeight: '700', color: COLORS.text, fontSize: 13 },
  menuSub: { fontSize: 11, color: COLORS.textLight, marginTop: 4 },
  kpiGrid: { paddingHorizontal: 20, gap: 12 },
  kpiCard: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  kpiBody: { flex: 1 },
  kpiLabel: { fontSize: 12, color: COLORS.textLight, marginBottom: 4 },
  kpiValue: { fontSize: 18, fontWeight: '700' },
});
