import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/theme';
import type { ThemeColors } from '../../theme/colors';
import { VehicleItem, VehicleService, VehicleTransaction } from '../../services/VehicleService';
import { PressableScale } from '../../components/PressableScale';
import { ScreenReveal } from '../../components/ScreenReveal';
import { Skeleton } from '../../components/Skeleton';

const titleFont = Platform.select({ ios: 'Avenir Next', android: 'serif' });

const statusColor = (status: string, colors: ThemeColors) => {
  const normalized = status.toLowerCase();
  if (normalized.includes('infracci')) {
    return colors.error;
  }
  if (normalized.includes('observaci')) {
    return colors.warning;
  }
  return colors.success;
};

const riskColor = (label: string | null | undefined, colors: ThemeColors) => {
  if (label === 'high') {
    return colors.error;
  }
  if (label === 'medium') {
    return colors.warning;
  }
  if (label === 'low') {
    return colors.success;
  }
  return colors.textLight;
};

const riskLabelText = (label?: string | null) => {
  if (label === 'high') {
    return 'IA: Alto';
  }
  if (label === 'medium') {
    return 'IA: Medio';
  }
  if (label === 'low') {
    return 'IA: Bajo';
  }
  if (label === 'unknown') {
    return 'IA: Pendiente';
  }
  return '';
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return '--';
  }
  return value.replace('T', ' ').slice(0, 16);
};

export default function VehicleDetailScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = useState<VehicleItem | null>(null);
  const [transactions, setTransactions] = useState<VehicleTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [vehicleData, txData] = await Promise.all([
          VehicleService.getVehicle(vehicleId),
          VehicleService.getVehicleTransactions(vehicleId),
        ]);
        setVehicle(vehicleData);
        setTransactions(txData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [vehicleId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <PressableScale onPress={() => navigation.goBack()} style={styles.headerAction}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </PressableScale>
          <View style={styles.headerText}>
            <Text style={[styles.title, { fontFamily: titleFont }]}>Vehículo</Text>
            <Text style={styles.subtitle}>Ficha y actividad reciente</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.card}>
            <Skeleton width="45%" height={14} />
            <Skeleton width="70%" height={10} style={{ marginTop: 12 }} />
            <Skeleton width="60%" height={10} style={{ marginTop: 8 }} />
          </View>
          <View style={styles.card}>
            <Skeleton width="55%" height={14} />
            <Skeleton width="80%" height={10} style={{ marginTop: 12 }} />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.error }}>Vehículo no encontrado.</Text>
        <PressableScale onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: colors.white }}>Volver</Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <PressableScale onPress={() => navigation.goBack()} style={styles.headerAction}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </PressableScale>
        <View style={styles.headerText}>
          <Text style={[styles.title, { fontFamily: titleFont }]}>Vehículo</Text>
          <Text style={styles.subtitle}>Ficha y actividad reciente</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <ScreenReveal delay={80}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ficha técnica</Text>
            <Text style={styles.metaText}>Placa: {vehicle.plate}</Text>
            <Text style={styles.metaText}>Modelo: {vehicle.model}</Text>
            <Text style={styles.metaText}>Combustible: {vehicle.fuelType}</Text>
            <Text style={styles.metaText}>Capacidad: {vehicle.capacityLiters} L</Text>
            <Text style={styles.metaText}>Propietario: {vehicle.ownerName ?? 'No disponible'}</Text>
            <Text style={styles.metaText}>Registrado: {formatDate(vehicle.createdAt)}</Text>
          </View>
        </ScreenReveal>

        <ScreenReveal delay={140}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Transacciones recientes</Text>
            {transactions.length === 0 ? (
              <Text style={styles.metaText}>Sin transacciones registradas.</Text>
            ) : (
              transactions.slice(0, 5).map((tx) => {
                const analysisTone = tx.analysis?.status ? statusColor(tx.analysis.status, colors) : colors.textLight;
                const riskTone = riskColor(tx.riskLabel, colors);
                return (
                  <PressableScale
                    key={tx.id}
                    style={styles.txRow}
                    onPress={() => navigation.navigate('TransactionDetail', { transactionId: tx.id })}
                  >
                    <View>
                      <Text style={styles.txTitle}>{tx.stationName ?? 'Estación'}</Text>
                      <Text style={styles.txMeta}>
                        {tx.liters} L | ${tx.totalAmount.toFixed(2)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.txDate}>{formatDate(tx.occurredAt)}</Text>
                      {!!tx.analysis?.status && (
                        <Text style={[styles.txStatus, { color: analysisTone }]}>{tx.analysis.status}</Text>
                      )}
                      {!!riskLabelText(tx.riskLabel) && (
                        <Text style={[styles.txStatus, { color: riskTone }]}>{riskLabelText(tx.riskLabel)}</Text>
                      )}
                    </View>
                  </PressableScale>
                );
              })
            )}
          </View>
        </ScreenReveal>
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
  metaText: { fontSize: 12, color: colors.textLight, marginTop: 4 },
  txRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txTitle: { fontWeight: '700', fontSize: 13, color: colors.text },
  txMeta: { fontSize: 12, color: colors.textLight },
  txDate: { fontSize: 11, color: colors.textLight },
  txStatus: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { marginTop: 12, backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
});
