import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TransactionItem, TransactionService } from '../../services/TransactionService';
import { Skeleton } from '../../components/Skeleton';

const titleFont = Platform.select({ ios: 'Avenir Next', android: 'serif' });

const statusColor = (status: string) => {
  if (status === 'Infracción') {
    return COLORS.error;
  }
  if (status === 'Observación') {
    return COLORS.warning;
  }
  return COLORS.success;
};

const riskColor = (label?: string | null) => {
  if (label === 'high') {
    return COLORS.error;
  }
  if (label === 'medium') {
    return COLORS.warning;
  }
  if (label === 'low') {
    return COLORS.success;
  }
  return '#777';
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
  return value.slice(0, 10);
};

export default function TransactionListScreen({ navigation }: any) {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 20;

  const loadData = useCallback(async (pageToLoad: number, replace: boolean, showLoader = true) => {
    try {
      setError('');
      if (replace) {
        if (showLoader) {
          setLoading(true);
        }
      } else {
        setLoadingMore(true);
      }
      const response = await TransactionService.getTransactionsPage(pageToLoad, PAGE_SIZE);
      let nextCount = 0;
      setTransactions((prev) => {
        const next = replace ? response.items : [...prev, ...response.items];
        nextCount = next.length;
        return next;
      });
      const nextTotal = response.total ?? 0;
      setHasMore(nextTotal ? nextCount < nextTotal : response.items.length === PAGE_SIZE);
      setPage(pageToLoad);
    } catch (err) {
      setError('No se pudieron cargar las transacciones.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadData(1, true);
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(1, true, false);
    setRefreshing(false);
  }, [loadData]);

  const handleLoadMore = () => {
    if (loading || loadingMore || refreshing || !hasMore) {
      return;
    }
    void loadData(page + 1, false);
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return transactions;
    }
    return transactions.filter((tx) =>
      `${tx.stationName ?? ''} ${tx.vehiclePlate ?? ''}`.toLowerCase().includes(query)
    );
  }, [search, transactions]);

  const renderSkeleton = () => (
    <View style={styles.skeletonWrap}>
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={`tx-skeleton-${index}`} style={styles.skeletonCard}>
          <Skeleton width="55%" height={14} />
          <Skeleton width="70%" height={10} style={{ marginTop: 10 }} />
          <Skeleton width="40%" height={10} style={{ marginTop: 8 }} />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Skeleton width={70} height={18} radius={999} />
            <Skeleton width={70} height={18} radius={999} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerAction}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.title, { fontFamily: titleFont }]}>Transacciones</Text>
          <Text style={styles.subtitle}>Consumo, riesgo IA y trazabilidad</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{transactions.length}</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.input}
          placeholder="Buscar por estación o placa..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        renderSkeleton()
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadData(1, true)} style={styles.retryBtn}>
            <Text style={{ color: 'white' }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} /> : null
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No hay transacciones con ese filtro.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const analysisColor = item.analysis?.status ? statusColor(item.analysis.status) : COLORS.textLight;
            const riskTone = riskColor(item.riskLabel);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}
              >
              <View style={styles.cardHeader}>
                <Text style={styles.station}>{item.stationName ?? 'Estación'}</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </View>
              <Text style={styles.meta}>Placa: {item.vehiclePlate ?? '--'}</Text>
              <Text style={styles.meta}>
                {item.liters} L | ${item.totalAmount.toFixed(2)}
              </Text>
              <View style={styles.rowInfo}>
                <Text style={styles.date}>{formatDate(item.occurredAt)}</Text>
                <View style={styles.badgeRow}>
                  {!!item.analysis?.status && (
                    <Text
                      style={[
                        styles.badge,
                        {
                          color: analysisColor,
                          backgroundColor: `${analysisColor}1A`,
                          borderColor: `${analysisColor}33`,
                        },
                      ]}
                    >
                      {item.analysis.status}
                    </Text>
                  )}
                  {!!riskLabelText(item.riskLabel) && (
                    <Text
                      style={[
                        styles.badge,
                        {
                          color: riskTone,
                          backgroundColor: `${riskTone}1A`,
                          borderColor: `${riskTone}33`,
                        },
                      ]}
                    >
                      {riskLabelText(item.riskLabel)}
                    </Text>
                  )}
                </View>
              </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  headerBadge: {
    minWidth: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    alignItems: 'center',
  },
  headerBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  input: { marginLeft: 10, flex: 1 },
  card: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  station: { fontWeight: 'bold', fontSize: 15 },
  meta: { fontSize: 12, color: COLORS.textLight, marginTop: 6 },
  rowInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  badgeRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  date: { fontSize: 11, color: COLORS.textLight },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  errorBox: { alignItems: 'center', marginTop: 40, padding: 20 },
  errorText: { color: COLORS.error, marginBottom: 12 },
  retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#777', fontSize: 12 },
  skeletonWrap: { padding: 20, gap: 12 },
  skeletonCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
});
