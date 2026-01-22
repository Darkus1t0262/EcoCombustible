import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/theme';
import type { ThemeColors } from '../../theme/colors';
import { PressableScale } from '../../components/PressableScale';
import { ScreenReveal } from '../../components/ScreenReveal';
import { AuditService, AuditItem } from '../../services/AuditService';
import { Skeleton } from '../../components/Skeleton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PremiumTokens } from '../../theme/premium';
import { getPremiumTokens } from '../../theme/premium';

const titleFont = Platform.select({ ios: 'Avenir Next', android: 'serif' });

export default function AuditScreen({ navigation }: any) {
  const { colors, resolvedMode } = useTheme();
  const tokens = useMemo(() => getPremiumTokens(colors, resolvedMode), [colors, resolvedMode]);
  const styles = useMemo(() => createStyles(colors, tokens), [colors, tokens]);
  const insets = useSafeAreaInsets();
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAudits = async () => {
    setLoading(true);
    const data = await AuditService.getAudits();
    setAudits(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAudits();
  }, []);

  const handleUpdate = (auditId: number, status: 'approved' | 'rejected') => {
    Alert.alert(
      'Confirmar',
      `Marcar auditoría como ${status === 'approved' ? 'aprobada' : 'rechazada'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar',
          onPress: async () => {
            await AuditService.updateAuditStatus(auditId, status);
            await loadAudits();
          },
        },
      ]
    );
  };

  const total = audits.length;
  const approved = audits.filter((a) => a.status === 'approved').length;
  const pending = audits.filter((a) => a.status === 'pending').length;

  const renderSkeleton = () => (
    <View style={styles.skeletonWrap}>
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={`audit-skeleton-${index}`} style={styles.skeletonCard}>
          <Skeleton width="55%" height={12} />
          <Skeleton width="35%" height={10} style={{ marginTop: 8 }} />
          <Skeleton width="80%" height={10} style={{ marginTop: 12 }} />
          <Skeleton width="90%" height={10} style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={tokens.backgroundColors} style={styles.background} />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <PressableScale
          onPress={() => navigation.goBack()}
          style={styles.headerAction}
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </PressableScale>
        <View style={styles.headerText}>
          <Text style={[styles.title, { fontFamily: titleFont }]}>Auditorías</Text>
          <Text style={styles.subtitle}>Revisión remota y validación en campo</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenReveal delay={80}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>{total}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: colors.success }]}>{approved}</Text>
              <Text style={styles.summaryLabel}>Aprobadas</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: colors.warning }]}>{pending}</Text>
              <Text style={styles.summaryLabel}>Pendientes</Text>
            </View>
          </View>
        </ScreenReveal>

        {loading ? (
          renderSkeleton()
        ) : audits.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No hay auditorías registradas.</Text>
          </View>
        ) : (
          audits.map((audit, index) => {
            const statusLabel =
              audit.status === 'approved' ? 'Aprobada' : audit.status === 'rejected' ? 'Rechazada' : 'Pendiente';
            const statusColor =
              audit.status === 'approved' ? colors.success : audit.status === 'rejected' ? colors.error : colors.warning;
            const content = (
              <View style={styles.card}>
                <LinearGradient
                  colors={tokens.stripeColors}
                  locations={[0, 0.45, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardStripes}
                />
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{audit.stationName}</Text>
                    <Text style={styles.cardMeta}>Código: {audit.code}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${statusColor}1A`, borderColor: `${statusColor}33` },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                </View>

                <View style={styles.checkItem}>
                  <View>
                    <Text style={styles.checkTitle}>Precio de combustible</Text>
                    <Text style={styles.checkMeta}>
                      Esperado: ${audit.priceExpected} | Reportado: ${audit.priceReported}
                    </Text>
                  </View>
                  <Ionicons
                    name={audit.priceExpected === audit.priceReported ? 'checkmark-circle' : 'alert-circle'}
                    size={22}
                    color={audit.priceExpected === audit.priceReported ? colors.success : colors.error}
                  />
                </View>

                <View style={styles.checkItem}>
                  <View>
                    <Text style={styles.checkTitle}>Calibración del dispensador</Text>
                    <Text style={styles.checkMeta}>Estado: {audit.dispenserOk ? 'OK' : 'Falla'}</Text>
                  </View>
                  <Ionicons
                    name={audit.dispenserOk ? 'checkmark-circle' : 'alert-circle'}
                    size={22}
                    color={audit.dispenserOk ? colors.success : colors.error}
                  />
                </View>

                {audit.status === 'pending' && (
                  <View style={styles.actions}>
                    <PressableScale
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() => handleUpdate(audit.id, 'approved')}
                    >
                      <Text style={styles.actionText}>Aprobar</Text>
                    </PressableScale>
                    <PressableScale
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleUpdate(audit.id, 'rejected')}
                    >
                      <Text style={styles.actionText}>Rechazar</Text>
                    </PressableScale>
                  </View>
                )}
              </View>
            );

            if (index < 6) {
              return (
                <ScreenReveal key={audit.id} delay={index * 50}>
                  {content}
                </ScreenReveal>
              );
            }
            return <View key={audit.id}>{content}</View>;
          })
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors, tokens: PremiumTokens) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: tokens.cardSurface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.cardBorder,
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.cardSurface,
    borderWidth: 1,
    borderColor: tokens.cardBorder,
  },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  scroll: { padding: 20, paddingBottom: 30 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 10 },
  summaryCard: {
    flex: 1,
    backgroundColor: tokens.cardSurface,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tokens.cardBorder,
    alignItems: 'center',
  },
  summaryValue: { fontSize: 18, fontWeight: '700' },
  summaryLabel: { fontSize: 11, color: colors.textLight, marginTop: 4 },
  card: {
    backgroundColor: tokens.cardSurface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tokens.cardBorder,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: tokens.shadowOpacity,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: 'hidden',
  },
  cardStripes: {
    ...StyleSheet.absoluteFillObject,
    opacity: tokens.isDark ? 0.6 : 0.35,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  cardTitle: { fontWeight: '700', fontSize: 16, color: colors.text },
  cardMeta: { fontSize: 12, color: colors.textLight, marginTop: 4 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  checkItem: {
    backgroundColor: colors.surfaceAlt,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkTitle: { fontWeight: '600', fontSize: 13, color: colors.text },
  checkMeta: { fontSize: 12, color: colors.textLight, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  approveBtn: { backgroundColor: colors.success },
  rejectBtn: { backgroundColor: colors.error },
  actionText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  emptyBox: { paddingVertical: 30, alignItems: 'center' },
  emptyText: { fontSize: 12, color: colors.textLight },
  skeletonWrap: { gap: 12 },
  skeletonCard: {
    backgroundColor: tokens.cardSurface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tokens.cardBorder,
  },
});
