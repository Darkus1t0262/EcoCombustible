import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/theme';
import type { ThemeColors } from '../../theme/colors';
import { VehicleItem, VehicleService } from '../../services/VehicleService';
import { PressableScale } from '../../components/PressableScale';
import { ScreenReveal } from '../../components/ScreenReveal';
import { Skeleton } from '../../components/Skeleton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PremiumTokens } from '../../theme/premium';
import { getPremiumTokens } from '../../theme/premium';

const titleFont = Platform.select({ ios: 'Avenir Next', android: 'serif' });

export default function VehicleListScreen({ navigation }: any) {
  const { colors, resolvedMode } = useTheme();
  const tokens = useMemo(() => getPremiumTokens(colors, resolvedMode), [colors, resolvedMode]);
  const styles = useMemo(() => createStyles(colors, tokens), [colors, tokens]);
  const insets = useSafeAreaInsets();
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
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
      const response = await VehicleService.getVehiclesPage(pageToLoad, PAGE_SIZE);
      let nextCount = 0;
      setVehicles((prev) => {
        const next = replace ? response.items : [...prev, ...response.items];
        nextCount = next.length;
        return next;
      });
      const nextTotal = response.total ?? 0;
      setHasMore(nextTotal ? nextCount < nextTotal : response.items.length === PAGE_SIZE);
      setPage(pageToLoad);
    } catch (err) {
      setError('No se pudieron cargar los vehículos.');
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

  const filtered = vehicles.filter((v) => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return `${v.plate} ${v.model}`.toLowerCase().includes(query);
  });

  const renderSkeleton = () => (
    <View style={styles.skeletonWrap}>
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={`vehicle-skeleton-${index}`} style={styles.skeletonCard}>
          <Skeleton width="45%" height={14} />
          <Skeleton width="70%" height={10} style={{ marginTop: 10 }} />
          <Skeleton width="60%" height={10} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={tokens.backgroundColors} style={styles.background} />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <PressableScale
          onPress={() => navigation.goBack()}
          style={styles.headerAction}
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </PressableScale>
        <View style={styles.headerText}>
          <Text style={[styles.title, { fontFamily: titleFont }]}>Vehículos</Text>
          <Text style={styles.subtitle}>Flota registrada y consumo</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{vehicles.length}</Text>
        </View>
      </View>

      <ScreenReveal delay={80}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={colors.textLight} />
          <TextInput
            style={styles.input}
            placeholder="Buscar por placa o modelo..."
            placeholderTextColor={colors.textLight}
            value={search}
            onChangeText={setSearch}
          />
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
              <Text style={styles.emptyText}>No hay vehículos con ese filtro.</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const content = (
              <PressableScale
                style={styles.card}
                onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
              >
                <LinearGradient
                  colors={tokens.stripeColors}
                  locations={[0, 0.45, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardStripes}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.plate}>{item.plate}</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
                </View>
                <Text style={styles.model}>{item.model}</Text>
                <View style={styles.rowInfo}>
                  <Text style={styles.meta}>Combustible: {item.fuelType}</Text>
                  <Text style={styles.meta}>Capacidad: {item.capacityLiters} L</Text>
                </View>
              </PressableScale>
            );
            if (index < 8) {
              return <ScreenReveal delay={index * 40}>{content}</ScreenReveal>;
            }
            return content;
          }}
        />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors, tokens: PremiumTokens) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: tokens.cardSurface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.cardBorder,
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.cardSurface,
    borderWidth: 1,
    borderColor: tokens.cardBorder,
  },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  headerBadge: {
    minWidth: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: tokens.cardSurface,
    borderWidth: 1,
    borderColor: tokens.cardBorder,
    alignItems: 'center',
  },
  headerBadgeText: { fontSize: 12, fontWeight: '700', color: colors.text },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.cardSurface,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tokens.cardBorder,
  },
  input: { marginLeft: 10, flex: 1, color: colors.text },
  card: {
    backgroundColor: tokens.cardSurface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: tokens.cardBorder,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: tokens.shadowOpacity,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardStripes: {
    ...StyleSheet.absoluteFillObject,
    opacity: tokens.isDark ? 0.6 : 0.35,
  },
  plate: { fontWeight: '700', fontSize: 16, color: colors.text },
  model: { color: colors.textLight, fontSize: 12, marginBottom: 10 },
  rowInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontSize: 12, color: colors.textLight },
  errorBox: { alignItems: 'center', marginTop: 40, padding: 20 },
  errorText: { color: colors.error, marginBottom: 12 },
  retryBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: colors.textLight, fontSize: 12 },
  skeletonWrap: { padding: 20, gap: 12 },
  skeletonCard: {
    backgroundColor: tokens.cardSurface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tokens.cardBorder,
  },
});
