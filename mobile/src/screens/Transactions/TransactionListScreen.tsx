import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TransactionItem, TransactionService } from '../../services/TransactionService';

const statusColor = (status: string) => {
  if (status === 'Infraccion') {
    return COLORS.error;
  }
  if (status === 'Observacion') {
    return COLORS.warning;
  }
  return COLORS.success;
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return '--';
  }
  return value.slice(0, 10);
};

export default function TransactionListScreen({ navigation }: any) {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setError('');
      setLoading(true);
      const data = await TransactionService.getTransactions();
      setTransactions(data);
    } catch (err) {
      setError('No se pudieron cargar las transacciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return transactions;
    }
    return transactions.filter((tx) =>
      `${tx.stationName ?? ''} ${tx.vehiclePlate ?? ''}`.toLowerCase().includes(query)
    );
  }, [search, transactions]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Transacciones</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.input}
          placeholder="Buscar por estacion o placa..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadData} style={styles.retryBtn}>
            <Text style={{ color: 'white' }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20,paddingBottom:30 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.station}>{item.stationName ?? 'Estacion'}</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </View>
              <Text style={styles.meta}>Placa: {item.vehiclePlate ?? '--'}</Text>
              <Text style={styles.meta}>
                {item.liters} L | ${item.totalAmount.toFixed(2)}
              </Text>
              <View style={styles.rowInfo}>
                <Text style={styles.date}>{formatDate(item.occurredAt)}</Text>
                {!!item.analysis?.status && (
                  <Text style={[styles.badge, { color: statusColor(item.analysis.status) }]}>
                    {item.analysis.status}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, padding: 20, backgroundColor: 'white', flexDirection: 'row', gap: 15, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', margin: 20, padding: 10, borderRadius: 10, elevation: 2 },
  input: { marginLeft: 10, flex: 1 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  station: { fontWeight: 'bold', fontSize: 15 },
  meta: { fontSize: 12, color: '#555', marginTop: 6 },
  rowInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  date: { fontSize: 11, color: '#888' },
  badge: { fontSize: 11, fontWeight: 'bold' },
  errorBox: { alignItems: 'center', marginTop: 40, padding: 20 },
  errorText: { color: COLORS.error, marginBottom: 12 },
  retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
});
