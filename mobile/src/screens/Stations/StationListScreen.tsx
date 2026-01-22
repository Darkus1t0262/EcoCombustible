import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/theme';
import type { ThemeColors } from '../../theme/colors';
import { StationService } from '../../services/ApiSync';
import { analyzeStationBehavior, normalizeAnalysis } from '../../services/DecisionEngine';
import { PressableScale } from '../../components/PressableScale';
import { ScreenReveal } from '../../components/ScreenReveal';
import { Skeleton } from '../../components/Skeleton';

const titleFont = Platform.select({ ios: 'Avenir Next', android: 'serif' });

export default function StationListScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Cumplimiento' | 'Observación' | 'Infracción'>('all');
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
      const response = await StationService.getStationsPage(pageToLoad, PAGE_SIZE);
      const processed = response.items.map((s) => ({
        ...s,
        analysis: normalizeAnalysis(s.analysis ?? analyzeStationBehavior(s, colors), colors),
      }));
      let nextCount = 0;
      setStations((prev) => {
        const next = replace ? processed : [...prev, ...processed];
        nextCount = next.length;
        return next;
      });
      const nextTotal = response.total ?? 0;
      setHasMore(nextTotal ? nextCount < nextTotal : processed.length === PAGE_SIZE);
      setPage(pageToLoad);
    } catch (err) {
      setError('No se pudieron cargar las estaciones.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [colors]);

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

  const filteredStations = useMemo(
    () => stations.filter((s) => {
      const matchesSearch = `${s.name} ${s.address}`.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || s.analysis?.status === statusFilter;
      return matchesSearch && matchesStatus;
    }),
    [stations, search, statusFilter]
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonWrap}>
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={`station-skeleton-${index}`} style={styles.skeletonCard}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="80%" height={10} style={{ marginTop: 10 }} />
          <Skeleton width="45%" height={10} style={{ marginTop: 8 }} />
          <Skeleton width={90} height={18} radius={999} style={{ marginTop: 12 }} />
        </View>
      ))}
    </View>
  );

  const renderItem = ({ item, index }: any) => (
    <ScreenReveal delay={Math.min(index * 40, 200)}>
      <PressableScale style={styles.card} onPress={() => navigation.navigate('StationDetail', { stationId: item.id })}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.stationName}>{item.name}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </View>

        <Text style={styles.address}>{item.address}</Text>

        <View style={styles.rowInfo}>
          <Text style={{ fontSize: 12, color: colors.text }}>Precio: ${item.price}</Text>
          <Text style={{ fontSize: 12, color: colors.text }}>Stock: {item.stock} gl</Text>
        </View>

        <View style={[styles.badge, { backgroundColor: `${item.analysis.color}1A`, borderColor: `${item.analysis.color}33` }]}>
          <Ionicons
            name={item.analysis.status === 'Cumplimiento' ? 'checkmark-circle' : 'alert-circle'}
            size={16}
            color={item.analysis.color}
          />
          <Text style={[styles.badgeText, { color: item.analysis.color }]}>{item.analysis.status}</Text>
        </View>
      </PressableScale>
    </ScreenReveal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <PressableScale onPress={() => navigation.goBack()} style={styles.headerAction}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </PressableScale>
        <View style={styles.headerText}>
          <Text style={[styles.title, { fontFamily: titleFont }]}>Estaciones</Text>
          <Text style={styles.subtitle}>Estado, precio y stock reportado</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{stations.length}</Text>
        </View>
      </View>

      <ScreenReveal delay={80}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={colors.textLight} />
          <TextInput
            style={styles.input}
            placeholder="Buscar por nombre o zona..."
            placeholderTextColor={colors.textLight}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </ScreenReveal>
      <ScreenReveal delay={120}>
        <View style={styles.filterContainer}>
          <PressableScale style={[styles.filterButton, statusFilter === 'all' && styles.filterButtonActive]} onPress={() => setStatusFilter('all')}>
            <Text style={[styles.filterButtonText, statusFilter === 'all' && styles.filterButtonTextActive]}>Todos</Text>
          </PressableScale>
          <PressableScale style={[styles.filterButton, statusFilter === 'Cumplimiento' && styles.filterButtonActive]} onPress={() => setStatusFilter('Cumplimiento')}>
            <Text style={[styles.filterButtonText, statusFilter === 'Cumplimiento' && styles.filterButtonTextActive]}>Cumplimiento</Text>
          </PressableScale>
          <PressableScale style={[styles.filterButton, statusFilter === 'Observación' && styles.filterButtonActive]} onPress={() => setStatusFilter('Observación')}>
            <Text style={[styles.filterButtonText, statusFilter === 'Observación' && styles.filterButtonTextActive]}>Observación</Text>
          </PressableScale>
          <PressableScale style={[styles.filterButton, statusFilter === 'Infracción' && styles.filterButtonActive]} onPress={() => setStatusFilter('Infracción')}>
            <Text style={[styles.filterButtonText, statusFilter === 'Infracción' && styles.filterButtonTextActive]}>Infracción</Text>
          </PressableScale>
        </View>
      </ScreenReveal>

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
          data={filteredStations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} /> : null
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No hay estaciones con ese filtro.</Text>
            </View>
          }
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
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderColor,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  stationName: { fontWeight: '700', fontSize: 16, color: colors.text },
  address: { color: colors.textLight, fontSize: 12, marginBottom: 10 },
  rowInfo: { flexDirection: 'row', gap: 15, marginBottom: 10 },
  badge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
  },
  badgeText: { fontWeight: '700', fontSize: 12 },
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
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  filterButtonTextActive: {
    color: colors.surface,
  },
});
