import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '../../theme/theme';
import type { ThemeColors } from '../../theme/colors';
import { analyzeStationBehavior, normalizeAnalysis } from '../../services/DecisionEngine';
import { Ionicons } from '@expo/vector-icons';
import { StationService } from '../../services/ApiSync';
import { PressableScale } from '../../components/PressableScale';
import { ScreenReveal } from '../../components/ScreenReveal';

const titleFont = Platform.select({ ios: 'Avenir Next', android: 'serif' });

export default function MapScreen({ navigation }: any) {
  const { colors, resolvedMode } = useTheme();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
  const filters = useMemo(
    () => [
      { label: 'Todas', value: 'Todas', color: colors.primary },
      { label: 'Normal', value: 'Normal', color: colors.success },
      { label: 'Observación', value: 'Observación', color: colors.warning },
      { label: 'Infracción', value: 'Infracción', color: colors.error },
    ],
    [colors]
  );
  const mapRef = useRef<MapView | null>(null);
  const [filter, setFilter] = useState('Todas');
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLocation, setHasLocation] = useState(false);
  const [selectedStation, setSelectedStation] = useState<any | null>(null);
  const [error, setError] = useState('');

  const initialRegion = { latitude: -1.8312, longitude: -78.1834, latitudeDelta: 5, longitudeDelta: 5 };

  const loadStations = useCallback(async () => {
    // Carga estaciones y normaliza analisis para la UI.
    try {
      setError('');
      setLoading(true);
      const data = await StationService.getAllStations();
      const processed = data.map((s) => ({
        ...s,
        analysis: normalizeAnalysis(s.analysis ?? analyzeStationBehavior(s, colors), colors),
      }));
      setStations(processed);
    } catch (err) {
      setError('No se pudieron cargar las estaciones.');
    } finally {
      setLoading(false);
    }
  }, [colors]);

  useEffect(() => {
    loadStations();
  }, [loadStations]);

  useEffect(() => {
    // Solicita ubicacion para centrar el mapa en el usuario.
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
    // Enfoca el mapa en la estacion seleccionada.
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

  // Normaliza texto con tildes para comparar estados.
  const normalizeStatus = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const getFilterKey = (status: string) => {
    const normalized = normalizeStatus(status);
    if (normalized.includes('infrac')) {
      return 'infraccion';
    }
    if (normalized.includes('observa')) {
      return 'observacion';
    }
    if (normalized.includes('cumpl')) {
      return 'normal';
    }
    return 'normal';
  };

  const filteredStations =
    filter === 'Todas'
      ? stations
      : stations.filter((s) => getFilterKey(s.analysis.status) === normalizeStatus(filter));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <PressableScale onPress={() => navigation.goBack()} style={styles.headerAction}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </PressableScale>
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

        <ScreenReveal delay={80} style={styles.filterBar}>
          <Text style={styles.filterLabel}>Filtro</Text>
          <View style={styles.filterRow}>
            {filters.map((item) => (
              <PressableScale
                key={item.value}
                onPress={() => setFilter(item.value)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: filter === item.value ? item.color : colors.surfaceAlt,
                    borderColor: filter === item.value ? item.color : colors.borderColor,
                  },
                ]}
              >
                <Text style={[styles.filterText, filter === item.value && styles.filterTextActive]}>{item.label}</Text>
              </PressableScale>
            ))}
          </View>
        </ScreenReveal>

        <ScreenReveal delay={120} style={styles.legend}>
          <Text style={styles.legendTitle}>Leyenda IA</Text>
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
            <Text style={styles.legText}>Normal</Text>
          </View>
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: colors.warning }]} />
            <Text style={styles.legText}>Observación</Text>
          </View>
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: colors.error }]} />
            <Text style={styles.legText}>Infracción</Text>
          </View>
        </ScreenReveal>

        {loading && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.overlayText}>Cargando estaciones...</Text>
          </View>
        )}

        {!!error && !loading && (
          <View style={styles.overlay}>
            <Text style={styles.errorText}>{error}</Text>
            <PressableScale style={styles.retryBtn} onPress={loadStations}>
              <Text style={styles.retryText}>Reintentar</Text>
            </PressableScale>
          </View>
        )}

        {!!selectedStation && (
          <ScreenReveal delay={40} style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>{selectedStation.name}</Text>
              <PressableScale onPress={handleDeselectStation}>
                <Ionicons name="close" size={18} color={colors.textLight} />
              </PressableScale>
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
            <PressableScale
              style={[styles.detailBtn, { backgroundColor: selectedStation.analysis.color }]}
              onPress={() => navigation.navigate('StationDetail', { stationId: selectedStation.id })}
            >
              <Text style={styles.detailBtnText}>Ver detalle</Text>
            </PressableScale>
          </ScreenReveal>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors, resolvedMode: 'light' | 'dark') => {
  const overlayBg = resolvedMode === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(248, 249, 251, 0.9)';
  return StyleSheet.create({
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
    mapWrap: { flex: 1, position: 'relative' },
    map: { flex: 1 },
    filterBar: {
      position: 'absolute',
      top: 14,
      left: 16,
      right: 16,
      padding: 10,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderColor,
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 6,
      zIndex: 10,
      elevation: 8,
    },
    filterLabel: { fontSize: 12, fontWeight: '600', color: colors.textLight },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    filterPill: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      borderWidth: 1,
    },
    filterText: { fontSize: 10, fontWeight: '700', color: colors.textLight },
    filterTextActive: { color: colors.white },
    legend: {
      position: 'absolute',
      bottom: 30,
      right: 20,
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.borderColor,
      zIndex: 10,
      elevation: 8,
    },
    legendTitle: { fontWeight: '700', fontSize: 11, marginBottom: 6, color: colors.text },
    row: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    legText: { fontSize: 10, color: colors.textLight },
    callout: {
      width: 220,
      backgroundColor: colors.surface,
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderColor,
    },
    calloutTitle: { fontWeight: '700', marginBottom: 4, color: colors.text, fontSize: 12 },
    calloutStatus: { fontWeight: '700', marginBottom: 4, fontSize: 11 },
    calloutText: { fontSize: 11, color: colors.textLight },
    detailCard: {
      position: 'absolute',
      left: 20,
      right: 20,
      bottom: 110,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderColor,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
      zIndex: 12,
    },
    detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
    detailTitle: { fontWeight: '700', fontSize: 16, color: colors.text, flex: 1 },
    detailStatus: { fontWeight: '700', marginTop: 6 },
    detailText: { fontSize: 12, color: colors.textLight, marginTop: 6 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    detailMeta: { fontSize: 12, color: colors.textLight },
    detailBtn: { marginTop: 12, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    detailBtnText: { color: colors.white, fontWeight: '700' },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: overlayBg,
      paddingHorizontal: 20,
      gap: 12,
    },
    overlayText: { fontSize: 12, color: colors.textLight },
    errorText: { color: colors.error, textAlign: 'center' },
    retryBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
    retryText: { color: colors.white, fontWeight: '700' },
  });
};
