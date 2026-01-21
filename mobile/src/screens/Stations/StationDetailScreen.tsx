import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/theme';
import type { ThemeColors } from '../../theme/colors';
import { StationService } from '../../services/ApiSync';
import { analyzeStationBehavior, normalizeAnalysis } from '../../services/DecisionEngine';
import { USE_REMOTE_AUTH } from '../../config/env';
import { Skeleton } from '../../components/Skeleton';

const titleFont = Platform.select({ ios: 'Avenir Next', android: 'serif' });

export default function StationDetailScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { stationId } = route.params;
  const [station, setStation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await StationService.getStationDetails(stationId);
      if (data) {
        setStation({ ...data, analysis: normalizeAnalysis(data.analysis ?? analyzeStationBehavior(data, colors), colors) });
      }
      setLoading(false);
    };
    load();
  }, [stationId, colors]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerAction}>
            <Ionicons name="arrow-back" size={20} color={colors.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Cargando estación</Text>
            <Text style={styles.headerSubtitle}>Resumen operativo</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.card}>
            <Skeleton width="40%" height={14} />
            <Skeleton width="70%" height={10} style={{ marginTop: 12 }} />
            <Skeleton width="55%" height={10} style={{ marginTop: 8 }} />
          </View>
          <View style={styles.card}>
            <Skeleton width="60%" height={14} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
              <Skeleton width="40%" height={18} />
              <Skeleton width="40%" height={18} />
            </View>
          </View>
          <View style={styles.card}>
            <Skeleton width="55%" height={14} />
            <Skeleton width="65%" height={18} style={{ marginTop: 12 }} />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!station) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.error }}>Estación no encontrada.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: colors.white }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: station.analysis.color }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerAction}>
          <Ionicons name="arrow-back" size={20} color={colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{station.name}</Text>
          <Text style={styles.headerSubtitle}>Estación regulada</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{station.analysis.status}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Diagnóstico IA</Text>
          <View style={styles.analysisRow}>
            <Ionicons name="analytics" size={22} color={station.analysis.color} />
            <Text style={[styles.analysisStatus, { color: station.analysis.color }]}>{station.analysis.status}</Text>
          </View>
          <Text style={styles.bodyText}>{station.analysis.message}</Text>
          {typeof station.analysis.score === 'number' && (
            <Text style={styles.bodyText}>Puntaje IA: {station.analysis.score}</Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>Inventario y ventas</Text>
            <Text style={styles.cardHint}>Fuente: {USE_REMOTE_AUTH ? 'API' : 'BD local'}</Text>
          </View>

          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Stock actual</Text>
              <Text style={styles.value}>{station.stock} gal</Text>
            </View>
            <View>
              <Text style={styles.label}>Precio de venta</Text>
              <Text style={styles.value}>${station.price}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>Tendencia de ventas</Text>
            <Text style={[styles.cardHint, { color: colors.purple }]}>Fuente: Historial</Text>
          </View>
          <Text style={styles.value}>
            {Array.isArray(station.history) && station.history.length > 0
              ? `${Math.round(
                  station.history.reduce((acc: number, val: number) => acc + Number(val), 0) / station.history.length
                )} gal/día`
              : 'Sin historial'}
          </Text>
          <Text style={styles.label}>Promedio de ventas recientes</Text>
        </View>

        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.warning }]} onPress={() => navigation.navigate('Audit')}>
          <Text style={styles.btnText}>Iniciar auditoría manual</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.white, fontFamily: titleFont },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerBadgeText: { fontSize: 11, fontWeight: '700', color: colors.white },
  body: { padding: 20, paddingBottom: 30 },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderColor,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: { fontWeight: '700', fontSize: 15, marginBottom: 10, color: colors.text },
  analysisRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  analysisStatus: { fontWeight: '700', fontSize: 16 },
  bodyText: { color: colors.textLight, marginTop: 6 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardHint: { fontSize: 10, color: colors.textLight },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 },
  label: { color: colors.textLight, fontSize: 12, marginTop: 4 },
  value: { fontSize: 20, fontWeight: '700', color: colors.text },
  btn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 6 },
  btnText: { fontWeight: '700', color: colors.text },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { marginTop: 12, backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
});
