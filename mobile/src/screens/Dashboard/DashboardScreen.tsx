import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Modal, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/theme';
import type { ThemeColors } from '../../theme/colors';
import { PressableScale } from '../../components/PressableScale';
import { ScreenReveal } from '../../components/ScreenReveal';
import { AuthService } from '../../services/AuthService';
import { StatsService } from '../../services/StatsService';

const titleFont = Platform.select({ ios: 'Avenir Next', android: 'serif' });

export default function DashboardScreen({ navigation }: any) {
  const { colors, resolvedMode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState({ stations: 0, auditsTotal: 0, pendingAudits: 0, pendingComplaints: 0 });
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    // Carga estadisticas del dashboard al montar la pantalla.
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
    // Cierra sesion y vuelve al login.
    setShowLogoutModal(false);
    await AuthService.logout();
    navigation.replace('Login');
  };

  const isDark = resolvedMode === 'dark';
  // Alterna el tema sin reiniciar la app.
  const handleToggleTheme = () => setMode(isDark ? 'light' : 'dark');

  const HeroStat = ({ label, value, icon, tone }: any) => (
    <View style={[styles.heroStat, { borderColor: `${tone}40`, backgroundColor: `${tone}12` }]}>
      <View style={[styles.heroStatIcon, { backgroundColor: `${tone}1A`, borderColor: `${tone}33` }]}>
        {typeof icon === 'string' ? <Ionicons name={icon as any} size={16} color={tone} /> : icon}
      </View>
      <View style={styles.heroStatBody}>
        <Text style={styles.heroStatValue}>{value}</Text>
        <Text style={styles.heroStatLabel}>{label}</Text>
      </View>
    </View>
  );

  const AlertCard = ({ title, value, hint, icon, color, onPress }: any) => (
    <PressableScale style={[styles.alertCard, { borderColor: `${color}33` }]} onPress={onPress}>
      <View style={styles.alertTop}>
        <View style={[styles.alertIcon, { backgroundColor: `${color}1A`, borderColor: `${color}33` }]}>
          {typeof icon === 'string' ? <Ionicons name={icon as any} size={18} color={color} /> : icon}
        </View>
        <Text style={[styles.alertValue, { color }]}>{value}</Text>
      </View>
      <Text style={styles.alertTitle}>{title}</Text>
      <Text style={styles.alertHint}>{hint}</Text>
    </PressableScale>
  );

  const ActionCard = ({ title, sub, icon, color, onPress }: any) => (
    <PressableScale style={styles.actionCard} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: `${color}1A`, borderColor: `${color}33` }]}>
        {typeof icon === 'string' ? <Ionicons name={icon as any} size={20} color={color} /> : icon}
      </View>
      <View style={styles.actionBody}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSub}>{sub}</Text>
      </View>
      <View style={[styles.actionChevron, { borderColor: `${color}33` }]}>
        <Ionicons name="arrow-forward" size={14} color={color} />
      </View>
    </PressableScale>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: Math.max(insets.top, 16) }]}>
        <ScreenReveal delay={80}>
          <View style={styles.hero}>
            <LinearGradient
              colors={[`${colors.accent}3D`, `${colors.primary}22`, `${colors.surface}00`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            />
            <View style={styles.heroTop}>
              <View style={styles.brandRow}>
                <View style={styles.brandIcon}>
                  <Image source={require('../../../assets/logo.jpg')} style={styles.brandLogo} resizeMode="contain" />
                </View>
                <View style={styles.brandText}>
                  <Text style={styles.heroTitle} numberOfLines={1} ellipsizeMode="tail">
                    EcoCombustible
                  </Text>
                  <Text style={styles.heroSubtitle}>Panel operativo en tiempo real</Text>
                </View>
              </View>
              <View style={styles.heroActions}>
                <PressableScale style={styles.themeToggle} onPress={handleToggleTheme}>
                  <Ionicons name={isDark ? 'moon' : 'sunny'} size={16} color={colors.accent} />
                  <Text style={styles.themeToggleText}>{isDark ? 'Oscuro' : 'Claro'}</Text>
                </PressableScale>
                <PressableScale style={styles.logoutBtn} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={16} color={colors.white} />
                  <Text style={styles.logoutText}>Salir</Text>
                </PressableScale>
              </View>
            </View>

            <View style={styles.heroBullets}>
              <View style={styles.heroBullet}>
                <Ionicons name="flash-outline" size={14} color={colors.accent} />
                <Text style={styles.heroBulletText}>Alertas IA y trazabilidad inmediata</Text>
              </View>
              <View style={styles.heroBullet}>
                <Ionicons name="pulse-outline" size={14} color={colors.accent} />
                <Text style={styles.heroBulletText}>Consumo y auditorías siempre visibles</Text>
              </View>
              <View style={styles.heroBullet}>
                <Ionicons name="shield-checkmark-outline" size={14} color={colors.accent} />
                <Text style={styles.heroBulletText}>Prioridades claras para tomar acción</Text>
              </View>
            </View>

            {loading ? (
              <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 12 }} />
            ) : (
              <View style={styles.heroStats}>
                <HeroStat
                  label="Estaciones activas"
                  value={stats.stations}
                  icon={<MaterialCommunityIcons name="gas-station" size={16} color={colors.accent} />}
                  tone={colors.accent}
                />
                <HeroStat
                  label="Auditorías totales"
                  value={stats.auditsTotal}
                  icon="checkmark-circle"
                  tone={colors.success}
                />
              </View>
            )}
          </View>
        </ScreenReveal>

        <ScreenReveal delay={160}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Alertas activas</Text>
            <Text style={styles.sectionNote}>Ir directo a lo importante</Text>
          </View>
          <PressableScale style={styles.changePassBtn} onPress={() => navigation.navigate('ChangePassword')}>
            <Ionicons name="key-outline" size={16} color={colors.primary} />
            <Text style={styles.changePassText}>Cambiar contraseña</Text>
          </PressableScale>
          <View style={styles.alertGrid}>
            <AlertCard
              title="Denuncias pendientes"
              value={loading ? '--' : stats.pendingComplaints}
              hint="Revisar casos abiertos"
              icon="alert-circle"
              color={colors.error}
              onPress={() => navigation.navigate('Complaints')}
            />
            <AlertCard
              title="Auditorías pendientes"
              value={loading ? '--' : stats.pendingAudits}
              hint="Inspecciones en seguimiento"
              icon="checkmark-circle"
              color={colors.warning}
              onPress={() => navigation.navigate('Audit')}
            />
          </View>
        </ScreenReveal>

        <ScreenReveal delay={220}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Acciones rápidas</Text>
            <Text style={styles.sectionNote}>Entrar directo al punto</Text>
          </View>
          <View style={styles.actionGrid}>
            <ActionCard
              title="Mapa"
              sub="Riesgo en tiempo real"
              icon="map"
              color={colors.accent}
              onPress={() => navigation.navigate('Map')}
            />
            <ActionCard
              title="Estaciones"
              sub="Listado y control"
              icon={<MaterialCommunityIcons name="gas-station" size={20} color={colors.primary} />}
              color={colors.primary}
              onPress={() => navigation.navigate('StationList')}
            />
            <ActionCard
              title="Transacciones"
              sub="Consumo y trazas"
              icon="list"
              color={colors.success}
              onPress={() => navigation.navigate('TransactionList')}
            />
            <ActionCard
              title="Reportes"
              sub="Datos ejecutivos"
              icon="stats-chart"
              color={colors.secondary}
              onPress={() => navigation.navigate('Reports')}
            />
            <ActionCard
              title="Denuncias"
              sub="Bandeja prioritaria"
              icon="alert-circle"
              color={colors.error}
              onPress={() => navigation.navigate('Complaints')}
            />
            <ActionCard
              title="Vehículos"
              sub="Registro y control"
              icon="car"
              color={colors.primary}
              onPress={() => navigation.navigate('VehicleList')}
            />
          </View>
        </ScreenReveal>
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

            <Text style={styles.modalTitle}>Salir de la aplicación?</Text>
            <Text style={styles.modalText}>
              Seguro que deseas cerrar sesión?
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
                <Text style={styles.modalBtnConfirmText}>Si</Text>
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
  scroll: { paddingBottom: 36 },
  hero: {
    margin: 20,
    padding: 18,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderColor,
    overflow: 'hidden',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTop: { gap: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  brandIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  brandLogo: { width: 36, height: 36 },
  brandText: { flex: 1, minWidth: 0 },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    fontFamily: titleFont,
    includeFontPadding: false,
  },
  heroSubtitle: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
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
  heroBullets: {
    marginTop: 14,
    gap: 6,
  },
  heroBullet: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroBulletText: { fontSize: 11, color: colors.textLight },
  heroStats: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroStat: {
    width: '48%',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroStatIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatBody: { flex: 1 },
  heroStatValue: { fontSize: 16, fontWeight: '700', color: colors.text },
  heroStatLabel: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  sectionHeader: { marginHorizontal: 20, marginTop: 12, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, fontFamily: titleFont },
  sectionNote: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  alertGrid: { flexDirection: 'row', gap: 12, paddingHorizontal: 20 },
  alertCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  alertTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertValue: { fontSize: 18, fontWeight: '700' },
  alertTitle: { marginTop: 10, fontSize: 13, fontWeight: '700', color: colors.text },
  alertHint: { fontSize: 11, color: colors.textLight, marginTop: 4 },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderColor,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBody: { marginTop: 10 },
  actionTitle: { fontWeight: '700', color: colors.text, fontSize: 13 },
  actionSub: { fontSize: 11, color: colors.textLight, marginTop: 4 },
  actionChevron: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    backgroundColor: `${colors.primary}12`,
    alignSelf: 'flex-start',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  changePassText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
});
