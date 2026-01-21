import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Modal } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/theme';
import type { ThemeColors } from '../../theme/colors';
import { AuthService } from '../../services/AuthService';
import { StatsService } from '../../services/StatsService';

const titleFont = Platform.select({ ios: 'Avenir Next', android: 'serif' });

export default function DashboardScreen({ navigation }: any) {
  const { colors, resolvedMode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState({ stations: 0, auditsThisMonth: 0, pendingComplaints: 0 });
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await AuthService.logout();
    navigation.replace('Login');
  };

  const isDark = resolvedMode === 'dark';
  const handleToggleTheme = () => setMode(isDark ? 'light' : 'dark');

  const MenuCard = ({ title, sub, icon, color, onPress }: any) => (
    <TouchableOpacity style={styles.menuCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.menuHeaderRow}>
        <View style={[styles.menuIcon, { backgroundColor: `${color}1A`, borderColor: `${color}40` }]}>
          {typeof icon === 'string' ? <Ionicons name={icon as any} size={24} color={color} /> : icon}
        </View>
        <Ionicons name="arrow-forward" size={16} color={colors.textLight} />
      </View>
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuSub}>{sub}</Text>
    </TouchableOpacity>
  );

  const KPICard = ({ label, val, icon, color }: any) => (
    <View style={styles.kpiCard}>
      <View style={[styles.kpiIcon, { backgroundColor: `${color}1A`, borderColor: `${color}33` }]}>
        {typeof icon === 'string' ? <Ionicons name={icon as any} size={18} color={color} /> : icon}
      </View>
      <View style={styles.kpiBody}>
        <Text style={styles.kpiLabel}>{label}</Text>
        <Text style={[styles.kpiValue, { color }]}>{val}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroGlowAlt} />

          <View style={styles.heroTop}>
            <View style={styles.brandRow}>
              <View style={styles.brandIcon}>
                <MaterialCommunityIcons name="gas-station" size={22} color={colors.white} />
              </View>
              <View>
                <Text style={styles.heroTitle}>EcoCombustible</Text>
                <Text style={styles.heroSubtitle}>Control inteligente del subsidio</Text>
              </View>
            </View>
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.themeToggle} onPress={handleToggleTheme} activeOpacity={0.85}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={16} color={colors.primary} />
                <Text style={styles.themeToggleText}>{isDark ? 'Oscuro' : 'Claro'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={16} color={colors.white} />
                <Text style={styles.logoutText}>Salir</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Monitoreo nacional en tiempo real</Text>
          </View>
            <TouchableOpacity
              style={styles.changePassBtn}
              onPress={() => navigation.navigate('ChangePassword')}
            >
              <Ionicons name="key-outline" size={16} color={colors.primary} />
              <Text style={styles.changePassText}>Cambio de Contraseña</Text>
            </TouchableOpacity>   


        </View>

        <Text style={styles.sectionTitle}>Acciones rápidas</Text>
        <View style={styles.grid}>
          <MenuCard
            title="Estaciones"
            sub="Listado y estado"
            icon={<MaterialCommunityIcons name="gas-station" size={24} color={colors.primary} />}
            color={colors.primary}
            onPress={() => navigation.navigate('StationList')}
          />
          <MenuCard
            title="Mapa"
            sub="Vista geográfica"
            icon="map"
            color={colors.success}
            onPress={() => navigation.navigate('Map')}
          />
          <MenuCard
            title="Auditorías"
            sub="Revisión remota"
            icon="checkmark-circle"
            color={colors.warning}
            onPress={() => navigation.navigate('Audit')}
          />
          <MenuCard
            title="Denuncias" 
            sub="Bandeja"
            icon="alert-circle"
            color={colors.purple}
            onPress={() => navigation.navigate('Complaints')}
          />
          <MenuCard
            title="Reportes"
            sub="Estadísticas"
            icon="stats-chart"
            color={colors.secondary}
            onPress={() => navigation.navigate('Reports')}
          />
          <MenuCard
            title="Vehículos"
            sub="Registro"
            icon="car"
            color={colors.primary}
            onPress={() => navigation.navigate('VehicleList')}
          />
          <MenuCard
            title="Transacciones"
            sub="Consumo"
            icon="list"
            color={colors.success}
            onPress={() => navigation.navigate('TransactionList')}
          />
        </View>

        <Text style={styles.sectionTitle}>Resumen</Text>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 10 }} />
        ) : (
          <View style={styles.kpiGrid}>
            <KPICard
              label="Estaciones activas"
              val={stats.stations}
              icon={<MaterialCommunityIcons name="gas-station" size={18} color={colors.primary} />}
              color={colors.primary}
            />
            <KPICard
              label="Auditorías del mes"
              val={stats.auditsThisMonth}
              icon="checkmark-circle"
              color={colors.success}
            />
            <KPICard
              label="Denuncias pendientes"
              val={stats.pendingComplaints}
              icon="alert-circle"
              color={colors.error}
            />
          </View>
        )}
      </ScrollView>
      <Modal
        transparent
        animationType="fade"
        visible={showLogoutModal}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons
              name="log-out-outline"
              size={36}
              color={colors.error}
              style={{ marginBottom: 10 }}
            />

            <Text style={styles.modalTitle}>¿Salir de la aplicación?</Text>
            <Text style={styles.modalText}>
              ¿Está seguro de que desea cerrar sesión?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>No</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBtnConfirm}
                onPress={confirmLogout}
              >
                <Text style={styles.modalBtnConfirmText}>Sí</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 30 },
  hero: {
    margin: 20,
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderColor,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: `${colors.primary}22`,
    top: -40,
    right: -60,
  },
  heroGlowAlt: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: `${colors.success}1A`,
    bottom: -30,
    left: -40,
  },
  heroTop: { flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  heroTitle: { fontSize: 20, fontWeight: '700', color: colors.text, fontFamily: titleFont },
  heroSubtitle: { fontSize: 12, color: colors.textLight },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    width: '100%',
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderColor,
    backgroundColor: colors.surfaceAlt,
  },
  themeToggleText: { fontSize: 12, fontWeight: '600', color: colors.text },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.error,
  },
  logoutText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  heroBadge: {
    marginTop: 16,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
  },
  heroBadgeText: { fontSize: 11, color: colors.textLight, fontWeight: '600' },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
    fontFamily: titleFont,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20 },
  menuCard: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderColor,
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
  menuTitle: { marginTop: 10, fontWeight: '700', color: colors.text, fontSize: 13 },
  menuSub: { fontSize: 11, color: colors.textLight, marginTop: 4 },
  kpiGrid: { paddingHorizontal: 20, gap: 12 },
  kpiCard: {
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderColor,
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
  kpiLabel: { fontSize: 12, color: colors.textLight, marginBottom: 4 },
  kpiValue: { fontSize: 18, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    fontFamily: titleFont,
  },
  modalText: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtnCancel: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
  },
  modalBtnCancelText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  modalBtnConfirm: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: `${colors.error}15`,
    borderWidth: 1,
    borderColor: `${colors.error}40`,
  },
  modalBtnConfirmText: {
    color: colors.error,
    fontWeight: '700',
    fontSize: 13,
  },
  changePassBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: `${colors.primary}33`,
  backgroundColor: `${colors.primary}12`,
  alignSelf: 'flex-start',
  marginTop: 12,
},
changePassText: {
  color: colors.primary,
  fontWeight: '600',
  fontSize: 12,
},

});
