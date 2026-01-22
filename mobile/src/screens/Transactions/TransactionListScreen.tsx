import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/theme';
import type { ThemeColors } from '../../theme/colors';
import { PressableScale } from '../../components/PressableScale';
import { ScreenReveal } from '../../components/ScreenReveal';
import { TransactionItem, TransactionService } from '../../services/TransactionService';
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
  return value.slice(0, 10);
};

export default function TransactionListScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

  const summary = useMemo(() => {
    let totalAmount = 0;
    let totalLiters = 0;
    let alerts = 0;
    let observations = 0;
    filtered.forEach((tx) => {
      totalAmount += tx.totalAmount ?? 0;
      totalLiters += tx.liters ?? 0;
      const status = tx.analysis?.status ?? '';
      const normalized = status.toLowerCase();
      const high = normalized.includes('infracci') || tx.riskLabel === 'high';
      const medium = normalized.includes('observaci') || tx.riskLabel === 'medium';
      if (high) {
        alerts += 1;
      } else if (medium) {
        observations += 1;
      }
    });
    return { totalAmount, totalLiters, alerts, observations };
  }, [filtered]);

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
        <PressableScale onPress={() => navigation.goBack()} style={styles.headerAction}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </PressableScale>
        <View style={styles.headerText}>
          <Text style={[styles.title, { fontFamily: titleFont }]}>Transacciones</Text>
          <Text style={styles.subtitle}>Consumo, riesgo IA y trazabilidad</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{transactions.length}</Text>
        </View>
      </View>

      <ScreenReveal delay={80}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={colors.textLight} />
          <TextInput
            style={styles.input}
            placeholder="Buscar por estación o placa..."
            placeholderTextColor={colors.textLight}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </ScreenReveal>

      {!loading && !error && (
        <ScreenReveal delay={140}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <Text style={styles.summaryTitle}>Resumen rápido</Text>
              <View style={[styles.summaryChip, { borderColor: `${colors.error}40`, backgroundColor: `${colors.error}15` }]}>
                <Text style={[styles.summaryChipText, { color: colors.error }]}>{summary.alerts} alertas</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryBlock}>
                <Text style={styles.summaryValue}>${summary.totalAmount.toFixed(2)}</Text>
                <Text style={styles.summaryLabel}>Monto total</Text>
              </View>
              <View style={styles.summaryBlock}>
                <Text style={styles.summaryValue}>{summary.totalLiters.toFixed(1)} L</Text>
                <Text style={styles.summaryLabel}>Litros</Text>
              </View>
            </View>
            <View style={styles.summaryFooter}>
              <View style={[styles.summaryChip, { borderColor: `${colors.warning}40`, backgroundColor: `${colors.warning}12` }]}>
                <Text style={[styles.summaryChipText, { color: colors.warning }]}>{summary.observations} observaciones</Text>
              </View>
            </View>
          </View>
        </ScreenReveal>
      )}

      {loading ? (
        renderSkeleton()
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <PressableScale onPress={() => loadData(1, true)} style={styles.retryBtn}>
            <Text style={{ color: colors.white }}>Reintentar</Text>
          </PressableScale>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20, paddingTop: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} /> : null
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No hay transacciones con ese filtro.</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const analysisColor = item.analysis?.status ? statusColor(item.analysis.status, colors) : colors.accent;
            const riskTone = riskColor(item.riskLabel, colors);
            const revealDelay = index < 8 ? index * 40 : 0;
            return (
              <ScreenReveal delay={revealDelay}>
                <PressableScale
                  style={styles.card}
                  onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}
                >
                  <View style={[styles.cardAccent, { backgroundColor: analysisColor }]} />
                  <View style={styles.cardTop}>
                    <View style={styles.cardLeft}>
                      <Text style={styles.station}>{item.stationName ?? 'Estación'}</Text>
                      <Text style={styles.meta}>Placa: {item.vehiclePlate ?? '--'}</Text>
                      <Text style={styles.meta}>{formatDate(item.occurredAt)}</Text>
                    </View>
                    <View style={styles.amountBlock}>
                      <Text style={styles.amount}>${item.totalAmount.toFixed(2)}</Text>
                      <Text style={styles.amountSub}>{item.liters} L</Text>
                    </View>
                  </View>
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
                </PressableScale>
              </ScreenReveal>
            );
          }}
        />
      )}
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  input: { marginLeft: 10, flex: 1, color: colors.text },
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 6,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderColor,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  summaryChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  summaryChipText: { fontSize: 11, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  summaryBlock: { flex: 1 },
  summaryValue: { fontSize: 18, fontWeight: '700', color: colors.text },
  summaryLabel: { fontSize: 11, color: colors.textLight, marginTop: 4 },
  summaryFooter: { marginTop: 10, flexDirection: 'row', gap: 8 },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    paddingLeft: 20,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderColor,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    position: 'relative',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 4,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cardLeft: { flex: 1 },
  station: { fontWeight: '700', fontSize: 15, color: colors.text },
  meta: { fontSize: 11, color: colors.textLight, marginTop: 4 },
  amountBlock: { alignItems: 'flex-end' },
  amount: { fontSize: 16, fontWeight: '700', color: colors.text },
  amountSub: { fontSize: 11, color: colors.textLight, marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 12 },
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
  errorText: { color: colors.error, marginBottom: 12 },
  retryBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: colors.textLight, fontSize: 12 },
  skeletonWrap: { padding: 20, gap: 12 },
  skeletonCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
});
