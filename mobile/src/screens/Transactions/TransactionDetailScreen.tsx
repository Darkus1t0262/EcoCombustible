import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TransactionItem, TransactionService } from '../../services/TransactionService';

const formatDate = (value?: string | null) => {
  if (!value) {
    return '--';
  }
  return value.replace('T', ' ').slice(0, 16);
};

const statusColor = (status: string) => {
  if (status === 'Infraccion') {
    return COLORS.error;
  }
  if (status === 'Observacion') {
    return COLORS.warning;
  }
  return COLORS.success;
};

export default function TransactionDetailScreen({ route, navigation }: any) {
  const { transactionId } = route.params;
  const [transaction, setTransaction] = useState<TransactionItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await TransactionService.getTransaction(transactionId);
        setTransaction(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [transactionId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: COLORS.error }}>Transaccion no encontrada.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: 'white' }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Detalle de transaccion</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <Text style={styles.metaText}>Estacion: {transaction.stationName ?? 'No disponible'}</Text>
          <Text style={styles.metaText}>Vehiculo: {transaction.vehiclePlate ?? 'No disponible'}</Text>
          <Text style={styles.metaText}>Fecha: {formatDate(transaction.occurredAt)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Consumo</Text>
          <Text style={styles.metaText}>Litros: {transaction.liters}</Text>
          <Text style={styles.metaText}>Precio unitario: ${transaction.unitPrice}</Text>
          <Text style={styles.metaText}>Total: ${transaction.totalAmount.toFixed(2)}</Text>
          {!!transaction.paymentMethod && <Text style={styles.metaText}>Pago: {transaction.paymentMethod}</Text>}
          {!!transaction.reportedBy && <Text style={styles.metaText}>Fuente: {transaction.reportedBy}</Text>}
        </View>

        {!!transaction.analysis && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Analisis</Text>
            <Text style={[styles.metaText, { color: statusColor(transaction.analysis.status) }]}>
              {transaction.analysis.status}
            </Text>
            {!!transaction.analysis.message && <Text style={styles.metaText}>{transaction.analysis.message}</Text>}
            {!!transaction.analysis.score && <Text style={styles.metaText}>Score: {transaction.analysis.score}</Text>}
          </View>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
            onPress={() => navigation.navigate('StationDetail', { stationId: transaction.stationId })}
          >
            <Text style={styles.actionText}>Ver estacion</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.secondary }]}
            onPress={() => navigation.navigate('VehicleDetail', { vehicleId: transaction.vehicleId })}
          >
            <Text style={styles.actionText}>Ver vehiculo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 50,
    padding: 20,
    backgroundColor: 'white',
    flexDirection: 'row',
    gap: 15,
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  card: { backgroundColor: 'white', padding: 18, borderRadius: 12, marginBottom: 15, elevation: 2 },
  sectionTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  metaText: { fontSize: 12, color: '#555', marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 10, marginBottom: 20 },
  actionBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
  actionText: { color: 'white', fontWeight: 'bold' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { marginTop: 12, backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
});
