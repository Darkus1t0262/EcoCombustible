import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Modal,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/theme';
import type { ThemeColors } from '../../theme/colors';
import { PressableScale } from '../../components/PressableScale';
import { ScreenReveal } from '../../components/ScreenReveal';
import { CountUpText } from '../../components/CountUpText';
import { AuthService } from '../../services/AuthService';
import { StatsService } from '../../services/StatsService';

const titleFont = Platform.select({ ios: 'Avenir Next', android: 'serif' });

export default function DashboardScreen({ navigation }: any) {
  const { colors, resolvedMode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState({ stations: 0, auditsTotal: 0, pendingAudits: 0, pendingComplaints: 0 });
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const pulse = useRef(new Animated.Value(0.7)).current;

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

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.7,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse]);

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

  const gradientFor = (tone: string) =>
    isDark ? [`${tone}55`, 'rgba(12, 16, 24, 0.92)'] : [`${tone}24`, 'rgba(255, 255, 255, 0.94)'];

  const stripeColors = isDark
    ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.08)']
    : ['rgba(15, 23, 42, 0.08)', 'rgba(15, 23, 42, 0.02)', 'rgba(15, 23, 42, 0.08)'];

  const backgroundColors = isDark ? ['#0B0F19', '#121A2C', '#0F172A'] : ['#F8FAFF', '#EEF2F8', '#F8FAFF'];

  const actionGradients = useMemo(
    () => ({
      map: [colors.accent, colors.primary, colors.secondary],
      complaints: [colors.error, colors.warning, colors.secondary],
      stations: [colors.primary, colors.accent, colors.success],
      reports: [colors.primary, colors.accent, colors.secondary],
      audit: [colors.warning, colors.success, colors.accent],
      transactions: [colors.success, colors.accent, colors.primary],
      vehicles: [colors.primary, colors.accent, colors.success],
      security: [colors.secondary, colors.primary, colors.accent],
    }),
    [colors]
  );

  const IlloIcon = ({ gradient, iconType, iconName, size = 52 }: any) => (
    <View style={[styles.illoWrap, { width: size, height: size, borderRadius: size * 0.36 }]}>
      <View style={[styles.illoGlow, { backgroundColor: gradient[0] }]} />
      <LinearGradient colors={gradient} style={styles.illoGradient} />
      <View
        style={[
          styles.illoInner,
          { backgroundColor: isDark ? 'rgba(12, 16, 24, 0.86)' : 'rgba(255, 255, 255, 0.92)' },
        ]}
      />
      <View style={styles.illoIcon}>
        {renderIcon(iconType, iconName, Math.round(size * 0.42), isDark ? '#E6F0FF' : '#0F172A')}
      </View>
    </View>
  );

  const renderIcon = (type: 'ion' | 'mci', name: string, size: number, color: string) =>
    type === 'mci' ? (
      <MaterialCommunityIcons name={name as any} size={size} color={color} />
    ) : (
      <Ionicons name={name as any} size={size} color={color} />
    );

  const renderValue = (value: number | string, style: any) =>
    typeof value === 'number' ? <CountUpText value={value} style={style} /> : <Text style={style}>{value}</Text>;

  const QuickPrimaryCard = ({
    title,
    subtitle,
    value,
    valueLabel,
    iconType,
    iconName,
    color,
    gradient,
    onPress,
    pulseOpacity,
  }: any) => (
    <PressableScale style={[styles.quickPrimaryCard, { borderColor: `${color}30` }]} onPress={onPress}>
      <Animated.View style={[styles.quickPrimaryGlowWrap, pulseOpacity ? { opacity: pulseOpacity } : null]}>
        <LinearGradient
          colors={gradientFor(color)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.quickPrimaryGlow}
        />
      </Animated.View>
      <LinearGradient
        colors={stripeColors}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardStripes}
      />
      <View style={styles.quickPrimaryTop}>
        <IlloIcon gradient={gradient} iconType={iconType} iconName={iconName} size={54} />
        <View style={[styles.quickPrimaryValuePill, { backgroundColor: `${color}12`, borderColor: `${color}33` }]}>
          {renderValue(value, [styles.quickPrimaryValueText, { color }])}
        </View>
      </View>
      <Text style={styles.quickPrimaryTitle}>{title}</Text>
      <Text style={styles.quickPrimarySubtitle}>{subtitle}</Text>
      <Text style={styles.quickPrimaryLabel}>{valueLabel}</Text>
    </PressableScale>
  );

  const QuickMiniCard = ({ title, subtitle, iconType, iconName, color, gradient, onPress }: any) => (
    <PressableScale style={styles.quickMiniCard} onPress={onPress}>
      <LinearGradient
        colors={gradientFor(color)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.quickMiniGlow}
      />
      <LinearGradient
        colors={stripeColors}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardStripes}
      />
      <IlloIcon gradient={gradient} iconType={iconType} iconName={iconName} size={44} />
      <Text style={styles.quickMiniTitle}>{title}</Text>
      <Text style={styles.quickMiniSubtitle}>{subtitle}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textLight} style={styles.quickMiniChevron} />
    </PressableScale>
  );

  const SummaryCard = ({ title, value, note, tone, variant }: any) => (
    <View style={styles.summaryCard}>
      <LinearGradient
        colors={gradientFor(tone)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.summaryGlow}
      />
      <LinearGradient
        colors={stripeColors}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardStripes}
      />
      <View style={styles.summaryRow}>
        <View>
          <Text style={styles.summaryTitle}>{title}</Text>
          {renderValue(value, [styles.summaryValue, { color: tone }])}
          <Text style={styles.summaryNote}>{note}</Text>
        </View>
        {variant === 'ring' ? (
          <View style={[styles.summaryRing, { borderColor: tone }]}>
            {renderValue(value, [styles.summaryRingText, { color: tone }])}
          </View>
        ) : (
          <View style={styles.summarySpark}>
            <View style={[styles.summarySparkLine, { width: 26, backgroundColor: tone }]} />
            <View style={[styles.summarySparkLine, { width: 18, backgroundColor: tone }]} />
            <View style={[styles.summarySparkLine, { width: 32, backgroundColor: tone }]} />
          </View>
        )}
      </View>
    </View>
  );

  const quickPrimary = useMemo(
    () => [
      {
        key: 'map',
        title: 'Mapa',
        subtitle: 'Vista geográfica',
        value: loading ? '--' : stats.stations,
        valueLabel: 'estaciones activas',
        route: 'Map',
        color: colors.accent,
        iconType: 'ion',
        iconName: 'map',
        gradient: actionGradients.map,
        pulse: false,
      },
      {
        key: 'complaints',
        title: 'Denuncias',
        subtitle: 'Bandeja de seguimiento',
        value: loading ? '--' : stats.pendingComplaints,
        valueLabel: 'pendientes',
        route: 'Complaints',
        color: colors.error,
        iconType: 'ion',
        iconName: 'alert-circle',
        gradient: actionGradients.complaints,
        pulse: !loading && stats.pendingComplaints > 0,
      },
    ],
    [actionGradients, colors, loading, stats]
  );

  const quickMini = useMemo(
    () => [
      {
        key: 'stations',
        title: 'Estaciones',
        subtitle: 'Control',
        route: 'StationList',
        color: colors.primary,
        iconType: 'mci',
        iconName: 'gas-station',
        gradient: actionGradients.stations,
      },
      {
        key: 'reports',
        title: 'Reportes',
        subtitle: 'Estadísticas',
        route: 'Reports',
        color: colors.secondary,
        iconType: 'ion',
        iconName: 'stats-chart',
        gradient: actionGradients.reports,
      },
      {
        key: 'audit',
        title: 'Auditorías',
        subtitle: 'Revisión',
        route: 'Audit',
        color: colors.warning,
        iconType: 'mci',
        iconName: 'clipboard-text',
        gradient: actionGradients.audit,
      },
      {
        key: 'transactions',
        title: 'Transacciones',
        subtitle: 'Consumo',
        route: 'TransactionList',
        color: colors.success,
        iconType: 'ion',
        iconName: 'list',
        gradient: actionGradients.transactions,
      },
      {
        key: 'vehicles',
        title: 'Vehículos',
        subtitle: 'Registro',
        route: 'VehicleList',
        color: colors.primary,
        iconType: 'ion',
        iconName: 'car',
        gradient: actionGradients.vehicles,
      },
      {
        key: 'security',
        title: 'Seguridad',
        subtitle: 'Cambiar clave',
        route: 'ChangePassword',
        color: colors.secondary,
        iconType: 'ion',
        iconName: 'key',
        gradient: actionGradients.security,
      },
    ],
    [actionGradients, colors]
  );

  const summaries = useMemo(
    () => [
      {
        key: 'stations',
        title: 'Estaciones activas',
        value: loading ? '--' : stats.stations,
        note: 'Cobertura nacional',
        tone: colors.accent,
        variant: 'spark',
      },
      {
        key: 'audits',
        title: 'Auditorías totales',
        value: loading ? '--' : stats.auditsTotal,
        note: 'Historial completo',
        tone: colors.warning,
        variant: 'ring',
      },
    ],
    [colors, loading, stats]
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={backgroundColors} style={styles.background} />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Image source={require('../../../assets/logo.jpg')} style={styles.brandLogo} resizeMode="contain" />
            </View>
            <View style={styles.brandText}>
              <Text style={styles.brandTitle} numberOfLines={1}>
                EcoCombustible
              </Text>
              <Text style={styles.brandSubtitle}>Panel regulatorio</Text>
            </View>
          </View>
          <View style={styles.topActions}>
            <PressableScale style={styles.actionPill} onPress={handleToggleTheme} accessibilityLabel="Cambiar tema">
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={16} color={colors.accent} />
              <Text style={styles.actionPillText}>{isDark ? 'Oscuro' : 'Claro'}</Text>
            </PressableScale>
            <PressableScale style={styles.logoutPill} onPress={handleLogout} accessibilityLabel="Cerrar sesión">
              <Ionicons name="log-out-outline" size={16} color={colors.white} />
              <Text style={styles.logoutText}>Salir</Text>
            </PressableScale>
          </View>
        </View>

        <ScreenReveal delay={80}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Acciones rápidas</Text>
            <Text style={styles.sectionNote}>Acceso inmediato</Text>
          </View>
          <View style={styles.quickPrimaryRow}>
            {quickPrimary.map((item) => (
              <QuickPrimaryCard
                key={item.key}
                title={item.title}
                subtitle={item.subtitle}
                value={item.value}
                valueLabel={item.valueLabel}
                iconType={item.iconType}
                iconName={item.iconName}
                color={item.color}
                gradient={item.gradient}
                pulseOpacity={item.pulse ? pulse : undefined}
                onPress={() => navigation.navigate(item.route)}
              />
            ))}
          </View>
          <View style={styles.quickMiniRow}>
            {quickMini.map((item) => (
              <QuickMiniCard
                key={item.key}
                title={item.title}
                subtitle={item.subtitle}
                iconType={item.iconType}
                iconName={item.iconName}
                color={item.color}
                gradient={item.gradient}
                onPress={() => navigation.navigate(item.route)}
              />
            ))}
          </View>
        </ScreenReveal>

        <ScreenReveal delay={160}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Resumen</Text>
            <Text style={styles.sectionNote}>Indicadores clave</Text>
          </View>
          <View style={styles.summaryGrid}>
            {summaries.map((item) => (
              <SummaryCard
                key={item.key}
                title={item.title}
                value={item.value}
                note={item.note}
                tone={item.tone}
                variant={item.variant}
              />
            ))}
          </View>
        </ScreenReveal>

        {loading && <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 12 }} />}
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={showLogoutModal}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="log-out-outline" size={36} color={colors.error} style={{ marginBottom: 10 }} />
            <Text style={styles.modalTitle}>Salir de la aplicación?</Text>
            <Text style={styles.modalText}>Seguro que deseas cerrar sesión?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.modalBtnCancelText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={confirmLogout}>
                <Text style={styles.modalBtnConfirmText}>Si</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors, mode: 'light' | 'dark') => {
  const isDark = mode === 'dark';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
  const cardSurface = isDark ? 'rgba(13, 18, 28, 0.92)' : colors.surface;
  const shadowOpacity = isDark ? 0.22 : 0.08;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    background: {
      ...StyleSheet.absoluteFillObject,
    },
    scroll: { paddingBottom: 36 },
    topBar: {
      marginHorizontal: 20,
      marginBottom: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', minWidth: 0, flex: 1 },
    brandIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: cardSurface,
      borderWidth: 1,
      borderColor: cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    brandLogo: { width: 30, height: 30 },
    brandText: { flex: 1, minWidth: 0 },
    brandTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      fontFamily: titleFont,
      includeFontPadding: false,
    },
    brandSubtitle: { fontSize: 11, color: colors.textLight, marginTop: 2 },
    topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    actionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: cardBorder,
      backgroundColor: cardSurface,
    },
    actionPillText: { fontSize: 12, fontWeight: '600', color: colors.text },
    logoutPill: {
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
    sectionHeader: { marginHorizontal: 20, marginTop: 10, marginBottom: 10 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: titleFont },
    sectionNote: { fontSize: 11, color: colors.textLight, marginTop: 2 },
    quickPrimaryRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20 },
    quickPrimaryCard: {
      flex: 1,
      padding: 14,
      minHeight: 130,
      borderRadius: 20,
      backgroundColor: cardSurface,
      borderWidth: 1,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    quickPrimaryGlowWrap: {
      ...StyleSheet.absoluteFillObject,
    },
    quickPrimaryGlow: {
      ...StyleSheet.absoluteFillObject,
    },
    cardStripes: {
      ...StyleSheet.absoluteFillObject,
      opacity: isDark ? 0.6 : 0.35,
    },
    illoWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    illoGlow: {
      position: 'absolute',
      width: '120%',
      height: '120%',
      borderRadius: 999,
      opacity: isDark ? 0.28 : 0.18,
      transform: [{ scale: 1.05 }],
    },
    illoGradient: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: 999,
    },
    illoInner: {
      position: 'absolute',
      width: '72%',
      height: '72%',
      borderRadius: 999,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.18)',
    },
    illoIcon: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickPrimaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    quickPrimaryValuePill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
    },
    quickPrimaryValueText: { fontSize: 12, fontWeight: '700' },
    quickPrimaryTitle: { marginTop: 12, fontSize: 14, fontWeight: '700', color: colors.text },
    quickPrimarySubtitle: { marginTop: 4, fontSize: 11, color: colors.textLight },
    quickPrimaryLabel: { marginTop: 6, fontSize: 11, color: colors.textLight },
    quickMiniRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      gap: 12,
      marginTop: 12,
    },
    quickMiniCard: {
      width: '48%',
      padding: 12,
      borderRadius: 16,
      backgroundColor: cardSurface,
      borderWidth: 1,
      borderColor: cardBorder,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.18 : 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 1,
    },
    quickMiniGlow: { ...StyleSheet.absoluteFillObject },
    quickMiniTitle: { marginTop: 8, fontSize: 12, fontWeight: '700', color: colors.text },
    quickMiniSubtitle: { marginTop: 4, fontSize: 10, color: colors.textLight },
    quickMiniChevron: { position: 'absolute', right: 10, top: 10 },
    summaryGrid: { flexDirection: 'row', gap: 12, paddingHorizontal: 20 },
    summaryCard: {
      flex: 1,
      padding: 14,
      borderRadius: 18,
      backgroundColor: cardSurface,
      borderWidth: 1,
      borderColor: cardBorder,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    summaryGlow: { ...StyleSheet.absoluteFillObject },
    summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    summaryTitle: { fontSize: 12, fontWeight: '700', color: colors.text },
    summaryValue: { marginTop: 6, fontSize: 20, fontWeight: '700' },
    summaryNote: { marginTop: 4, fontSize: 10, color: colors.textLight },
    summarySpark: { alignItems: 'flex-end', gap: 6 },
    summarySparkLine: {
      height: 4,
      borderRadius: 999,
      opacity: 0.8,
    },
    summaryRing: {
      width: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryRingText: { fontSize: 10, fontWeight: '700' },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalCard: {
      width: '85%',
      backgroundColor: cardSurface,
      borderRadius: 20,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: cardBorder,
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
    modalActions: { flexDirection: 'row', gap: 12 },
    modalBtnCancel: {
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
    },
    modalBtnCancelText: { color: colors.text, fontWeight: '600', fontSize: 13 },
    modalBtnConfirm: {
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 999,
      backgroundColor: `${colors.error}15`,
      borderWidth: 1,
      borderColor: `${colors.error}40`,
    },
    modalBtnConfirmText: { color: colors.error, fontWeight: '700', fontSize: 13 },
  });
};
