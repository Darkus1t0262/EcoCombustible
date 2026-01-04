import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { VehicleItem, VehicleService, VehicleTransaction } from '../../services/VehicleService';

const formatDate = (value?: string | null) => {
  if (!value) {
    return '--';
  }
  return value.replace('T', ' ').slice(0, 16);
};

export default function VehicleDetailScreen({ route, navigation }: any) {
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: COLORS.error }}>Vehiculo no encontrado.</Text>
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
        <Text style={styles.title}>Detalle de vehiculo</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Vehiculo</Text>
          <Text style={styles.metaText}>Placa: {vehicle.plate}</Text>
          <Text style={styles.metaText}>Modelo: {vehicle.model}</Text>
          <Text style={styles.metaText}>Combustible: {vehicle.fuelType}</Text>
          <Text style={styles.metaText}>Capacidad: {vehicle.capacityLiters} L</Text>
          <Text style={styles.metaText}>Propietario: {vehicle.ownerName ?? 'No disponible'}</Text>
          <Text style={styles.metaText}>Registrado: {formatDate(vehicle.createdAt)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Transacciones recientes</Text>
          {transactions.length === 0 ? (
            <Text style={styles.metaText}>Sin transacciones registradas.</Text>
          ) : (
            transactions.slice(0, 5).map((tx) => (
              <TouchableOpacity
                key={tx.id}
                style={styles.txRow}
                onPress={() => navigation.navigate('TransactionDetail', { transactionId: tx.id })}
              >
                <View>
                  <Text style={styles.txTitle}>{tx.stationName ?? 'Estacion'}</Text>
                  <Text style={styles.txMeta}>
                    {tx.liters} L | ${tx.totalAmount.toFixed(2)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.txDate}>{formatDate(tx.occurredAt)}</Text>
                  {!!tx.analysis?.status && (
                    <Text style={[styles.txStatus, { color: statusColor(tx.analysis.status) }]}>
                      {tx.analysis.status}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const statusColor = (status: string) => {
  if (status === 'Infraccion') {
    return COLORS.error;
  }
  if (status === 'Observacion') {
    return COLORS.warning;
  }
  return COLORS.success;
};

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
  txRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txTitle: { fontWeight: 'bold', fontSize: 13 },
  txMeta: { fontSize: 12, color: '#666' },
  txDate: { fontSize: 11, color: '#888' },
  txStatus: { fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { marginTop: 12, backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
});
