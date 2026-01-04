import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { ComplaintItem, ComplaintService } from '../../services/ComplaintService';

type StatusFilter = 'all' | 'pending' | 'resolved';

const formatDate = (value?: string | null) => {
  if (!value) {
    return '--';
  }
  return value.slice(0, 10);
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: COLORS.error },
  resolved: { label: 'Resuelto', color: COLORS.success },
};

export default function ComplaintsScreen({ navigation }: any) {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setError('');
      setLoading(true);
      const [items, summary] = await Promise.all([
        ComplaintService.getComplaints(),
        ComplaintService.getStats(),
      ]);
      setComplaints(items);
      setStats(summary);
    } catch (err) {
      setError('No se pudieron cargar las denuncias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const renderItem = ({ item }: { item: ComplaintItem }) => {
    const statusInfo = statusConfig[item.status] ?? { label: item.status, color: COLORS.warning };
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ComplaintDetail', { complaintId: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.type}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}>
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
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Denuncias</Text>
        <TouchableOpacity onPress={loadData}>
          <Ionicons name="refresh" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={{ color: COLORS.success, fontWeight: 'bold', fontSize: 18 }}>{stats.resolved}</Text>
          <Text style={styles.statLabel}>Resueltas</Text>
        </View>
        <View style={styles.stat}>
          <Text style={{ color: COLORS.error, fontWeight: 'bold', fontSize: 18 }}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.stat}>
          <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 18 }}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por estacion, usuario o vehiculo..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {(['all', 'pending', 'resolved'] as StatusFilter[]).map((value) => {
          const label = value === 'all' ? 'Todas' : value === 'pending' ? 'Pendientes' : 'Resueltas';
          const isActive = filter === value;
          return (
            <TouchableOpacity
              key={value}
              onPress={() => setFilter(value)}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
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
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', margin: 20 },
  stat: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    width: '31%',
    alignItems: 'center',
    elevation: 1,
  },
  statLabel: { fontSize: 10, color: '#666' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 10,
    borderRadius: 10,
    elevation: 2,
  },
  searchInput: { marginLeft: 10, flex: 1 },
  filterRow: { flexDirection: 'row', gap: 10, margin: 20, marginTop: 15 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EAEAEA',
  },
  filterPillActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: 12, color: '#555', fontWeight: '600' },
  filterTextActive: { color: 'white' },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontWeight: 'bold', fontSize: 15 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  subtitle: { color: '#666', fontSize: 12, marginTop: 6 },
  metaText: { fontSize: 12, color: '#444', marginTop: 4 },
  dateText: { fontSize: 11, color: '#888', marginTop: 6 },
  errorBox: { alignItems: 'center', marginTop: 40, padding: 20 },
  errorText: { color: COLORS.error, marginBottom: 12 },
  retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
});
