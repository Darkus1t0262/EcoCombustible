import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { COLORS } from '../../theme/colors';
import { analyzeStationBehavior, normalizeAnalysis } from '../../services/DecisionEngine';
import { Ionicons } from '@expo/vector-icons';
import { StationService } from '../../services/ApiSync';

export default function MapScreen({ navigation }: any) {
  const mapRef = useRef<MapView | null>(null);
  const [filter, setFilter] = useState('Todas');
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLocation, setHasLocation] = useState(false);
  const [selectedStation, setSelectedStation] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await StationService.getAllStations();
      const processed = data.map((s) => ({
        ...s,
        analysis: normalizeAnalysis(s.analysis ?? analyzeStationBehavior(s)),
      }));
      setStations(processed);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const loadLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
      setHasLocation(true);
      const position = await Location.getCurrentPositionAsync({});
      mapRef.current?.animateToRegion(
        {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        },
        500
      );
    };
    loadLocation();
  }, []);

  const filteredStations =
    filter === 'Todas' ? stations : stations.filter((s) => s.analysis.status === filter);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Mapa de estaciones</Text>
      </View>

      <View style={styles.filterContainer}>
        <Text style={{ fontSize: 12, marginRight: 10, color: '#555' }}>Filtro:</Text>
        <TouchableOpacity onPress={() => setFilter('Todas')} style={[styles.pill, { backgroundColor: COLORS.primary }]}>
          <Text style={styles.pillText}>Todas</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('Cumplimiento')} style={[styles.pill, { backgroundColor: COLORS.success }]}>
          <Text style={styles.pillText}>OK</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('Observacion')} style={[styles.pill, { backgroundColor: COLORS.warning }]}>
          <Text style={styles.pillText}>Obs</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('Infraccion')} style={[styles.pill, { backgroundColor: COLORS.error }]}>
          <Text style={styles.pillText}>Alerta</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{ latitude: -1.8312, longitude: -78.1834, latitudeDelta: 5, longitudeDelta: 5 }}
          showsUserLocation={hasLocation}
          showsMyLocationButton={hasLocation}
        >
          {filteredStations.map((s) => (
            <Marker
              key={s.id}
              coordinate={{ latitude: s.lat, longitude: s.lng }}
              pinColor={s.analysis.color}
              onPress={() => setSelectedStation(s)}
            >
              <Callout tooltip>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{s.name}</Text>
                  <Text style={[styles.calloutStatus, { color: s.analysis.color }]}>{s.analysis.status}</Text>
                  <Text style={styles.calloutText}>Stock: {s.stock} gal</Text>
                  <Text style={styles.calloutText}>Precio: ${s.price}</Text>
                  <Text style={styles.calloutText}>Analisis: {s.analysis.message}</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}

      <View style={styles.legend}>
        <Text style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 5 }}>Leyenda IA</Text>
        <View style={styles.row}>
          <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
          <Text style={styles.legText}>Normal</Text>
        </View>
        <View style={styles.row}>
          <View style={[styles.dot, { backgroundColor: COLORS.warning }]} />
          <Text style={styles.legText}>Observacion</Text>
        </View>
        <View style={styles.row}>
          <View style={[styles.dot, { backgroundColor: COLORS.error }]} />
          <Text style={styles.legText}>Infraccion</Text>
        </View>
      </View>

      {!!selectedStation && (
        <View style={styles.detailCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.detailTitle}>{selectedStation.name}</Text>
            <TouchableOpacity onPress={() => setSelectedStation(null)}>
              <Ionicons name="close" size={18} color="#666" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.detailStatus, { color: selectedStation.analysis.color }]}>
            {selectedStation.analysis.status}
          </Text>
          <Text style={styles.detailText}>{selectedStation.analysis.message}</Text>
          {typeof selectedStation.analysis.score === 'number' && (
            <Text style={styles.detailText}>Score IA: {selectedStation.analysis.score}</Text>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailMeta}>Stock: {selectedStation.stock} gal</Text>
            <Text style={styles.detailMeta}>Precio: ${selectedStation.price}</Text>
          </View>
          <TouchableOpacity
            style={[styles.detailBtn, { backgroundColor: selectedStation.analysis.color }]}
            onPress={() => navigation.navigate('StationDetail', { stationId: selectedStation.id })}
          >
            <Text style={styles.detailBtnText}>Ver detalle</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, padding: 20, backgroundColor: 'white', flexDirection: 'row', gap: 15, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold' },
  map: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filterContainer: { position: 'absolute', top: 110, left: 10, right: 10, zIndex: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', padding: 10, borderRadius: 10 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginHorizontal: 3 },
  pillText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  legend: { position: 'absolute', bottom: 30, right: 20, backgroundColor: 'white', padding: 15, borderRadius: 10, elevation: 5 },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legText: { fontSize: 10 },
  callout: { width: 220, backgroundColor: 'white', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#E6E6E6' },
  calloutTitle: { fontWeight: 'bold', marginBottom: 4, color: '#111' },
  calloutStatus: { fontWeight: 'bold', marginBottom: 4 },
  calloutText: { fontSize: 11, color: '#333' },
  detailCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 110,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    elevation: 6,
  },
  detailTitle: { fontWeight: 'bold', fontSize: 16, color: '#111' },
  detailStatus: { fontWeight: 'bold', marginTop: 6 },
  detailText: { fontSize: 12, color: '#444', marginTop: 6 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  detailMeta: { fontSize: 12, color: '#555' },
  detailBtn: { marginTop: 12, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  detailBtnText: { color: 'white', fontWeight: 'bold' },
});
