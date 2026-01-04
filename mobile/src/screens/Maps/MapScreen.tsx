import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { COLORS } from '../../theme/colors';
import { analyzeStationBehavior } from '../../services/DecisionEngine';
import { Ionicons } from '@expo/vector-icons';
import { StationService } from '../../services/ApiSync';

export default function MapScreen({ navigation }: any) {
  const mapRef = useRef<MapView | null>(null);
  const [filter, setFilter] = useState('Todas');
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLocation, setHasLocation] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await StationService.getAllStations();
      const processed = data.map((s) => ({ ...s, analysis: analyzeStationBehavior(s) }));
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
        <Text style={styles.title}>Stations Map</Text>
      </View>

      <View style={styles.filterContainer}>
        <Text style={{ fontSize: 12, marginRight: 10, color: '#555' }}>Filter:</Text>
        <TouchableOpacity onPress={() => setFilter('Todas')} style={[styles.pill, { backgroundColor: COLORS.primary }]}>
          <Text style={styles.pillText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('Cumplimiento')} style={[styles.pill, { backgroundColor: COLORS.success }]}>
          <Text style={styles.pillText}>OK</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('Observacion')} style={[styles.pill, { backgroundColor: COLORS.warning }]}>
          <Text style={styles.pillText}>Obs</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('Infraccion')} style={[styles.pill, { backgroundColor: COLORS.error }]}>
          <Text style={styles.pillText}>Alert</Text>
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
            <Marker key={s.id} coordinate={{ latitude: s.lat, longitude: s.lng }} pinColor={s.analysis.color}>
              <Callout onPress={() => navigation.navigate('StationDetail', { stationId: s.id })}>
                <View style={{ width: 220, padding: 5 }}>
                  <Text style={{ fontWeight: 'bold' }}>{s.name}</Text>
                  <Text style={{ color: s.analysis.color, fontWeight: 'bold', marginVertical: 5 }}>{s.analysis.status}</Text>
                  <Text style={{ fontSize: 10 }}>Stock: {s.stock} gal</Text>
                  <Text style={{ fontSize: 10 }}>Precio: ${s.price}</Text>
                  <Text style={{ fontSize: 10, marginTop: 4 }}>AI: {s.analysis.msg}</Text>
                  <Text style={{ fontSize: 10, color: '#666', marginTop: 6 }}>Tap para ver detalle</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}

      <View style={styles.legend}>
        <Text style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 5 }}>AI Legend</Text>
        <View style={styles.row}>
          <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
          <Text style={styles.legText}>Normal</Text>
        </View>
        <View style={styles.row}>
          <View style={[styles.dot, { backgroundColor: COLORS.warning }]} />
          <Text style={styles.legText}>Observation</Text>
        </View>
        <View style={styles.row}>
          <View style={[styles.dot, { backgroundColor: COLORS.error }]} />
          <Text style={styles.legText}>Violation</Text>
        </View>
      </View>
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
});
