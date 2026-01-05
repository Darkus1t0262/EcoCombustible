import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { VehicleItem, VehicleService } from '../../services/VehicleService';

export default function VehicleListScreen({ navigation }: any) {
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setError('');
      setLoading(true);
      const data = await VehicleService.getVehicles();
      setVehicles(data);
    } catch (err) {
      setError('No se pudieron cargar los vehiculos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = vehicles.filter((v) => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return `${v.plate} ${v.model}`.toLowerCase().includes(query);
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Vehiculos</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.input}
          placeholder="Buscar por placa o modelo..."
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
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.plate}>{item.plate}</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </View>
              <Text style={styles.model}>{item.model}</Text>
              <View style={styles.rowInfo}>
                <Text style={styles.meta}>Combustible: {item.fuelType}</Text>
                <Text style={styles.meta}>Capacidad: {item.capacityLiters} L</Text>
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
  plate: { fontWeight: 'bold', fontSize: 16 },
  model: { color: '#666', fontSize: 12, marginBottom: 10 },
  rowInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontSize: 12, color: '#444' },
  errorBox: { alignItems: 'center', marginTop: 40, padding: 20 },
  errorText: { color: COLORS.error, marginBottom: 12 },
  retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
});
