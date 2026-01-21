import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../theme/theme';
import type { ThemeColors } from '../../theme/colors';
import { ComplaintItem, ComplaintService } from '../../services/ComplaintService';
import { PressableScale } from '../../components/PressableScale';
import { ScreenReveal } from '../../components/ScreenReveal';
import { Skeleton } from '../../components/Skeleton';

const titleFont = Platform.select({ ios: 'Avenir Next', android: 'serif' });

type StatusFilter = 'all' | 'pending' | 'resolved';

const formatDate = (value?: string | null) => {
  if (!value) {
    return '--';
  }
  return value.slice(0, 10);
};

export default function ComplaintsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const statusConfig = useMemo(
    () => ({
      pending: { label: 'Pendiente', color: colors.error },
      resolved: { label: 'Resuelto', color: colors.success },
    }),
    [colors]
  );

  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [filter, setFilter] = useState<StatusFilter>('all');
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
      const [pageResponse, summary] = await Promise.all([
        ComplaintService.getComplaintsPage(pageToLoad, PAGE_SIZE),
        replace ? ComplaintService.getStats() : Promise.resolve(null),
      ]);
      let nextCount = 0;
      setComplaints((prev) => {
        const next = replace ? pageResponse.items : [...prev, ...pageResponse.items];
        nextCount = next.length;
        return next;
      });
      const nextTotal = pageResponse.total ?? 0;
      setHasMore(nextTotal ? nextCount < nextTotal : pageResponse.items.length === PAGE_SIZE);
      setPage(pageToLoad);
      if (summary) {
        setStats(summary);
      }
    } catch (err) {
      setError('No se pudieron cargar las denuncias.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadData(1, true);
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData(1, true, false);
    }, [loadData])
  );

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
    const normalized = search.trim().toLowerCase();
    return complaints.filter((item) => {
      if (filter !== 'all' && item.status !== filter) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      const haystack = [
        item.stationName,
        item.type,
        item.reporterName ?? '',
        item.vehiclePlate ?? '',
        item.vehicleModel ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [complaints, filter, search]);

  const renderSkeleton = () => (
    <View style={styles.skeletonWrap}>
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={`complaint-skeleton-${index}`} style={styles.skeletonCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="45%" height={14} />
            <Skeleton width={70} height={18} radius={999} />
          </View>
          <Skeleton width="70%" height={10} style={{ marginTop: 10 }} />
          <Skeleton width="50%" height={10} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  );

  const renderItem = ({ item, index }: { item: ComplaintItem; index: number }) => {
    const statusInfo = statusConfig[item.status as keyof typeof statusConfig] ?? { label: item.status, color: colors.warning };
    return (
      <ScreenReveal delay={Math.min(index * 40, 200)}>
        <PressableScale
          style={styles.card}
          onPress={() => navigation.navigate('ComplaintDetail', { complaintId: item.id })}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.type}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}1A`, borderColor: `${statusInfo.color}33` }]}>
              <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>{item.stationName}</Text>
          {!!item.reporterName && (
            <Text style={styles.metaText}>
              Reporta: {item.reporterName}
              {item.reporterRole ? ` (${item.reporterRole})` : ''}
            </Text>
          )}
          {!!item.vehiclePlate && <Text style={styles.metaText}>Vehiculo: {item.vehiclePlate}</Text>}
          <Text style={styles.dateText}>Registrado: {formatDate(item.createdAt)}</Text>
        </PressableScale>
      </ScreenReveal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <PressableScale onPress={() => navigation.goBack()} style={styles.headerAction}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </PressableScale>
        <View style={styles.headerText}>
          <Text style={[styles.title, { fontFamily: titleFont }]}>Denuncias</Text>
          <Text style={styles.subtitle}>Seguimiento y resolucion</Text>
        </View>
        <View style={styles.headerActions}>
          <PressableScale onPress={() => navigation.navigate('NewComplaint')} style={styles.iconBtn}>
            <Ionicons name="add" size={18} color={colors.primary} />
          </PressableScale>
          <PressableScale onPress={() => loadData(1, true)} style={styles.iconBtn}>
            <Ionicons name="refresh" size={18} color={colors.primary} />
          </PressableScale>
        </View>
      </View>

      <ScreenReveal delay={80}>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={{ color: colors.success, fontWeight: '700', fontSize: 18 }}>{stats.resolved}</Text>
            <Text style={styles.statLabel}>Resueltas</Text>
          </View>
          <View style={styles.stat}>
            <Text style={{ color: colors.error, fontWeight: '700', fontSize: 18 }}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.stat}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 18 }}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </ScreenReveal>

      <ScreenReveal delay={120}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por estacion, usuario o vehiculo..."
            placeholderTextColor={colors.textLight}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </ScreenReveal>

      <ScreenReveal delay={160}>
        <View style={styles.filterRow}>
          {(['all', 'pending', 'resolved'] as StatusFilter[]).map((value) => {
            const label = value === 'all' ? 'Todas' : value === 'pending' ? 'Pendientes' : 'Resueltas';
            const isActive = filter === value;
            return (
              <PressableScale
                key={value}
                onPress={() => setFilter(value)}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{label}</Text>
              </PressableScale>
            );
          })}
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
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} /> : null
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No hay denuncias con ese filtro.</Text>
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
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 16, marginBottom: 12 },
  stat: {
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 12,
    width: '31%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderColor,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  statLabel: { fontSize: 10, color: colors.textLight },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  searchInput: { marginLeft: 10, flex: 1, color: colors.text },
  filterRow: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginTop: 10, marginBottom: 6 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  filterPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 12, color: colors.textLight, fontWeight: '600' },
  filterTextActive: { color: colors.white },
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontWeight: '700', fontSize: 15, color: colors.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '700' },
  metaText: { fontSize: 12, color: colors.textLight, marginTop: 4 },
  dateText: { fontSize: 11, color: colors.textLight, marginTop: 6 },
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
