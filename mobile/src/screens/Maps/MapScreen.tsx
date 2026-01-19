import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, ScrollView } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { COLORS } from '../../theme/colors';
import { analyzeStationBehavior, normalizeAnalysis } from '../../services/DecisionEngine';
import { Ionicons } from '@expo/vector-icons';
import { StationService } from '../../services/ApiSync';

const titleFont = Platform.select({ ios: 'Avenir Next', android: 'serif' });

const filters = [
  { label: 'Todas', value: 'Todas', color: COLORS.primary },
  { label: 'OK', value: 'Cumplimiento', color: COLORS.success },
  { label: 'Obs', value: 'Observación', color: COLORS.warning },
  { label: 'Alerta', value: 'Infracción', color: COLORS.error },
];

export default function MapScreen({ navigation }: any) {
  const mapRef = useRef<MapView | null>(null);
  const [filter, setFilter] = useState('Todas');
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLocation, setHasLocation] = useState(false);
  const [selectedStation, setSelectedStation] = useState<any | null>(null);
  const [error, setError] = useState('');

  const initialRegion = { latitude: -1.8312, longitude: -78.1834, latitudeDelta: 5, longitudeDelta: 5 };

  const loadStations = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      const data = await StationService.getAllStations();
      const processed = data.map((s) => ({
        ...s,
        analysis: normalizeAnalysis(s.analysis ?? analyzeStationBehavior(s)),
      }));
      setStations(processed);
    } catch (err) {
      setError('No se pudieron cargar las estaciones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStations();
  }, [loadStations]);

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

  const handleSelectStation = (station: any) => {
    setSelectedStation(station);
    mapRef.current?.animateToRegion(
      {
        latitude: station.lat,
        longitude: station.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500
    );
  };

  const handleDeselectStation = () => {
    setSelectedStation(null);
    mapRef.current?.animateToRegion(initialRegion, 500);
  };

  const filteredStations = filter === 'Todas' ? stations : stations.filter((s) => s.analysis.status === filter);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerAction}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.title, { fontFamily: titleFont }]}>Mapa de estaciones</Text>
          <Text style={styles.subtitle}>Monitoreo geográfico en tiempo real</Text>
        </View>
      </View>

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={hasLocation}
          showsMyLocationButton={hasLocation}
        >
          {filteredStations.map((s) => (
            <Marker
              key={s.id}
              coordinate={{ latitude: s.lat, longitude: s.lng }}
              pinColor={s.analysis.color}
              onPress={() => handleSelectStation(s)}
            >
              <Callout tooltip>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{s.name}</Text>
                  <Text style={[styles.calloutStatus, { color: s.analysis.color }]}>{s.analysis.status}</Text>
                  <Text style={styles.calloutText}>Stock: {s.stock} gal</Text>
                  <Text style={styles.calloutText}>Precio: ${s.price}</Text>
                  <Text style={styles.calloutText}>Análisis: {s.analysis.message}</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        <View style={styles.filterBar}>
          <Text style={styles.filterLabel}>Filtro</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {filters.map((item) => (
              <TouchableOpacity
                key={item.value}
                onPress={() => setFilter(item.value)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: filter === item.value ? item.color : COLORS.surfaceAlt,
                    borderColor: filter === item.value ? item.color : COLORS.borderColor,
                  },
                ]}
              >
                <Text style={[styles.filterText, filter === item.value && styles.filterTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Leyenda IA</Text>
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.legText}>Normal</Text>
          </View>
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: COLORS.warning }]} />
            <Text style={styles.legText}>Observación</Text>
          </View>
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: COLORS.error }]} />
            <Text style={styles.legText}>Infracción</Text>
          </View>
        </View>

        {loading && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.overlayText}>Cargando estaciones...</Text>
          </View>
        )}

        {!!error && !loading && (
          <View style={styles.overlay}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadStations}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {!!selectedStation && (
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>{selectedStation.name}</Text>
              <TouchableOpacity onPress={handleDeselectStation}>
                <Ionicons name="close" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.detailStatus, { color: selectedStation.analysis.color }]}>
              {selectedStation.analysis.status}
            </Text>
            <Text style={styles.detailText}>{selectedStation.analysis.message}</Text>
            {typeof selectedStation.analysis.score === 'number' && (
              <Text style={styles.detailText}>Puntaje IA: {selectedStation.analysis.score}</Text>
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
  mapWrap: { flex: 1 },
  map: { flex: 1 },
  filterBar: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textLight },
  filterScroll: { paddingRight: 6, gap: 8 },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterText: { fontSize: 11, fontWeight: '700', color: COLORS.textLight },
  filterTextActive: { color: COLORS.white },
  legend: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  legendTitle: { fontWeight: '700', fontSize: 11, marginBottom: 6, color: COLORS.text },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legText: { fontSize: 10, color: COLORS.textLight },
  callout: {
    width: 220,
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  calloutTitle: { fontWeight: '700', marginBottom: 4, color: COLORS.text, fontSize: 12 },
  calloutStatus: { fontWeight: '700', marginBottom: 4, fontSize: 11 },
  calloutText: { fontSize: 11, color: COLORS.textLight },
  detailCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 110,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  detailTitle: { fontWeight: '700', fontSize: 16, color: COLORS.text, flex: 1 },
  detailStatus: { fontWeight: '700', marginTop: 6 },
  detailText: { fontSize: 12, color: COLORS.textLight, marginTop: 6 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  detailMeta: { fontSize: 12, color: COLORS.textLight },
  detailBtn: { marginTop: 12, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  detailBtnText: { color: COLORS.white, fontWeight: '700' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 249, 251, 0.9)',
    paddingHorizontal: 20,
    gap: 12,
  },
  overlayText: { fontSize: 12, color: COLORS.textLight },
  errorText: { color: COLORS.error, textAlign: 'center' },
  retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: COLORS.white, fontWeight: '700' },
});
