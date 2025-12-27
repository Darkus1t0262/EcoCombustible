import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { StationService } from '../../services/ApiSync';
import { analyzeStationBehavior } from '../../services/DecisionEngine';

export default function StationListScreen({ navigation }: any) {
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await StationService.getAllStations();
    // Procesamos cada estación con tu IA antes de mostrarla
    const processed = data.map(s => ({...s, analysis: analyzeStationBehavior(s)}));
    setStations(processed);
    setLoading(false);
  };

  const filteredStations = stations.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('StationDetail', { station: item })}
    >
      <View style={{flexDirection:'row', justifyContent:'space-between'}}>
        <Text style={styles.stationName}>{item.name}</Text>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
      
      <Text style={styles.address}>{item.address}</Text>
      
      <View style={styles.rowInfo}>
        <Text style={{fontSize:12}}>Precio: ${item.price}</Text>
        <Text style={{fontSize:12}}>Stock: {item.stock} gl</Text>
      </View>

      {/* Etiqueta de Estado dada por la IA */}
      <View style={[styles.badge, { backgroundColor: item.analysis.color + '20' }]}> 
        <Ionicons name={item.analysis.status === 'Cumplimiento' ? "checkmark-circle" : "alert-circle"} size={16} color={item.analysis.color} />
        <Text style={[styles.badgeText, { color: item.analysis.color }]}>
          {item.analysis.status}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24}/></TouchableOpacity>
        <Text style={styles.title}>Estaciones Supervisadas</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput 
          style={styles.input} 
          placeholder="Buscar por nombre o zona..." 
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={filteredStations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{padding: 20}}
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
  stationName: { fontWeight: 'bold', fontSize: 16 },
  address: { color: '#666', fontSize: 12, marginBottom: 10 },
  rowInfo: { flexDirection: 'row', gap: 15, marginBottom: 10 },
  badge: { flexDirection: 'row', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, alignItems: 'center', gap: 5 },
  badgeText: { fontWeight: 'bold', fontSize: 12 }
});