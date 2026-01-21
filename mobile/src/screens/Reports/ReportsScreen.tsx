import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/theme';
import type { ThemeColors } from '../../theme/colors';
import { ReportService, ReportItem } from '../../services/ReportService';
import { PressableScale } from '../../components/PressableScale';
import { ScreenReveal } from '../../components/ScreenReveal';
import { Skeleton } from '../../components/Skeleton';

const periods = ['Semana', 'Mes', 'Ano'];
const titleFont = Platform.select({ ios: 'Avenir Next', android: 'serif' });

export default function ReportsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const formats = useMemo(
    () => [
      { label: 'PDF', color: colors.error },
      { label: 'Excel', color: colors.success },
      { label: 'CSV', color: colors.primary },
    ],
    [colors]
  );
  const [period, setPeriod] = useState('Mes');
  const [format, setFormat] = useState('PDF');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    const data = await ReportService.getReports();
    setReports(data);
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleCreate = async () => {
    try {
      setCreating(true);
      await ReportService.createReport(period, format);
      await loadReports();
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el reporte.');
    } finally {
      setCreating(false);
    }
  };

  const handleShare = async (report: ReportItem) => {
    try {
      await ReportService.shareReport(report);
    } catch (error) {
      Alert.alert('Error', 'No se pudo compartir el reporte.');
    }
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonWrap}>
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={`report-skeleton-${index}`} style={styles.skeletonCard}>
          <Skeleton width="50%" height={12} />
          <Skeleton width="70%" height={10} style={{ marginTop: 10 }} />
          <Skeleton width="45%" height={10} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <PressableScale onPress={() => navigation.goBack()} style={styles.headerAction}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </PressableScale>
        <View style={styles.headerText}>
          <Text style={[styles.title, { fontFamily: titleFont }]}>Reportes</Text>
          <Text style={styles.subtitle}>Exportacion automatica y manual</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{reports.length}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenReveal delay={80}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Generar nuevo reporte</Text>
            <Text style={styles.label}>Periodo</Text>
            <View style={styles.pillRow}>
              {periods.map((p) => (
                <PressableScale
                  key={p}
                  style={[styles.pill, p === period && styles.pillActive]}
                  onPress={() => setPeriod(p)}
                >
                  <Text style={[styles.pillText, p === period && styles.pillTextActive]}>{p}</Text>
                </PressableScale>
              ))}
            </View>

            <Text style={styles.label}>Formato de exportacion</Text>
            <View style={styles.formatRow}>
              {formats.map((f) => (
                <PressableScale
                  key={f.label}
                  style={[styles.formatBtn, f.label === format && { backgroundColor: f.color, borderColor: f.color }]}
                  onPress={() => setFormat(f.label)}
                >
                  <Text style={[styles.formatText, f.label === format && styles.formatTextActive]}>{f.label}</Text>
                </PressableScale>
              ))}
            </View>

            <PressableScale style={styles.generateBtn} onPress={handleCreate} disabled={creating}>
              {creating ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="document-text" color={colors.white} size={18} style={{ marginRight: 8 }} />
                  <Text style={styles.generateText}>Generar reporte</Text>
                </>
              )}
            </PressableScale>
          </View>
        </ScreenReveal>

        <Text style={styles.sectionTitle}>Reportes recientes</Text>
        {loading ? (
          renderSkeleton()
        ) : reports.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Aun no hay reportes disponibles.</Text>
          </View>
        ) : (
          reports.map((report, index) => {
            const canShare =
              Boolean(report.fileUri || report.fileUrl) &&
              report.status !== 'queued' &&
              report.status !== 'processing';
            const status = report.status ?? (canShare ? 'ready' : 'queued');
            const statusLabel =
              status === 'ready' ? 'Disponible' : status === 'failed' ? 'Error' : 'En proceso';
            const statusColor =
              status === 'ready' ? colors.success : status === 'failed' ? colors.error : colors.warning;

            return (
              <ScreenReveal key={report.id} delay={Math.min(index * 40, 200)}>
                <PressableScale
                  style={[styles.fileRow, !canShare && styles.fileRowDisabled]}
                  onPress={() => handleShare(report)}
                  disabled={!canShare}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fileTitle}>
                      {report.period} - {report.format}
                    </Text>
                    <Text style={styles.fileMeta}>
                      {report.createdAt.slice(0, 10)} - {report.sizeMb.toFixed(1)} MB
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${statusColor}1A`, borderColor: `${statusColor}33` }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                  </View>
                  <View style={[styles.shareChip, !canShare && styles.shareChipDisabled]}>
                    <Text style={[styles.shareText, !canShare && styles.shareTextDisabled]}>
                      {canShare ? 'Compartir' : 'No disponible'}
                    </Text>
                  </View>
                </PressableScale>
              </ScreenReveal>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  headerBadge: {
    minWidth: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderColor,
    alignItems: 'center',
  },
  headerBadgeText: { fontSize: 12, fontWeight: '700', color: colors.text },
  scroll: { padding: 20, paddingBottom: 30 },
  panel: {
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderColor,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  panelTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 10 },
  label: { marginTop: 10, marginBottom: 8, color: colors.textLight, fontWeight: '600', fontSize: 12 },
  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderColor,
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: 12, color: colors.textLight, fontWeight: '600' },
  pillTextActive: { color: colors.white },
  formatRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  formatBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderColor,
    backgroundColor: colors.surfaceAlt,
  },
  formatText: { fontSize: 12, color: colors.textLight, fontWeight: '600' },
  formatTextActive: { color: colors.white },
  generateBtn: {
    backgroundColor: colors.purple,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  generateText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 12,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  fileRow: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  fileRowDisabled: { opacity: 0.6 },
  fileTitle: { fontWeight: '700', fontSize: 14, color: colors.text },
  fileMeta: { fontSize: 12, color: colors.textLight, marginTop: 4 },
  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  shareChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  shareChipDisabled: { backgroundColor: colors.surfaceAlt },
  shareText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  shareTextDisabled: { color: colors.textLight },
  emptyBox: { paddingVertical: 30, alignItems: 'center' },
  emptyText: { fontSize: 12, color: colors.textLight },
  skeletonWrap: { gap: 12 },
  skeletonCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
});
