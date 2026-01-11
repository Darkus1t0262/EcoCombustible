import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { ReportService, ReportItem } from '../../services/ReportService';

const periods = ['Semana', 'Mes', 'Anio'];
const formats = ['PDF', 'Excel', 'CSV'];

export default function ReportsScreen({ navigation }: any) {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Reportes automaticos</Text>
      </View>

      <ScrollView style={{ padding: 20 }}>
        <View style={styles.card}>
          <Text style={{ fontWeight: 'bold', marginBottom: 15 }}>Generar nuevo reporte</Text>

          <Text style={styles.label}>Periodo</Text>
          <View style={styles.tabsRow}>
            {periods.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.tab, { backgroundColor: p === period ? COLORS.primary : 'transparent' }]}
                onPress={() => setPeriod(p)}
              >
                <Text style={{ color: p === period ? 'white' : '#333' }}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Formato de exportacion</Text>
          <View style={styles.formatRow}>
            {formats.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.exportBtn, { backgroundColor: f === format ? COLORS.primary : '#eee' }]}
                onPress={() => setFormat(f)}
              >
                <Text style={{ color: f === format ? 'white' : '#333' }}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.generateBtn} onPress={handleCreate} disabled={creating}>
            {creating ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="document-text" color="white" size={20} style={{ marginRight: 10 }} />
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Generar reporte</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={{ fontWeight: 'bold', marginTop: 20, marginBottom: 10 }}>Reportes recientes</Text>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          reports.map((report) => {
            const canShare = Boolean(report.fileUri || report.fileUrl) && report.status !== 'queued' && report.status !== 'processing';
            const status = report.status ?? (canShare ? 'ready' : 'queued');
            const statusLabel =
              status === 'ready'
                ? 'Disponible'
                : status === 'failed'
                  ? 'Error'
                  : 'En proceso';
            return (
            <TouchableOpacity
              key={report.id}
              style={[styles.fileRow, !canShare && styles.fileRowDisabled]}
              onPress={() => handleShare(report)}
              disabled={!canShare}
            >
              <View>
                <Text style={{ fontWeight: 'bold' }}>{report.period} - {report.format}</Text>
                <Text style={{ fontSize: 12, color: '#888' }}>
                  {report.createdAt.slice(0, 10)} - {report.sizeMb.toFixed(1)} MB
                </Text>
                <Text style={{ fontSize: 12, color: '#888' }}>Estado: {statusLabel}</Text>
              </View>
              <Text style={{ color: COLORS.primary }}>{canShare ? 'Compartir' : 'No disponible'}</Text>
            </TouchableOpacity>
          );
        })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, padding: 20, backgroundColor: 'white', flexDirection: 'row', gap: 15, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 15 },
  label: { marginBottom: 10, color: '#555', fontWeight: '600' },
  tabsRow: { flexDirection: 'row', backgroundColor: '#eee', borderRadius: 8, padding: 2, marginBottom: 15 },
  tab: { flex: 1, alignItems: 'center', padding: 8, borderRadius: 6 },
  formatRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  exportBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8 },
  generateBtn: { backgroundColor: COLORS.purple, padding: 15, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  fileRow: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fileRowDisabled: { opacity: 0.6 },
});
