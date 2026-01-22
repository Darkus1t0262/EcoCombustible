import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { detectAnomalies } from '../../services/AnomalyDetection';
import { useTheme } from '../../theme/theme';
import type { ThemeColors } from '../../theme/colors';
import type { PremiumTokens } from '../../theme/premium';
import { getPremiumTokens } from '../../theme/premium';
import { ScreenReveal } from '../../components/ScreenReveal';
import { LinearGradient } from 'expo-linear-gradient';

const titleFont = Platform.select({ ios: 'Avenir Next', android: 'serif' });

const STATIONS_DATA = [
  {
    id: 1,
    name: 'Petroecuador Norte (Quito)',
    lat: -0.1807,
    lon: -78.4678,
    history: [1000, 1050, 980, 1020, 1010],
    current: 1000,
  },
  {
    id: 2,
    name: 'Gasolinera El Oro (Machala)',
    lat: -3.2581,
    lon: -79.9551,
    history: [500, 520, 510, 490, 530],
    current: 2000,
  },
  {
    id: 3,
    name: 'Primax Centro (Guayaquil)',
    lat: -2.1962,
    lon: -79.8862,
    history: [800, 850, 820, 810, 830],
    current: 100,
  },
];

export default function StationsMap() {
  const { colors, resolvedMode } = useTheme();
  const tokens = useMemo(() => getPremiumTokens(colors, resolvedMode), [colors, resolvedMode]);
  const styles = useMemo(() => createStyles(colors, tokens), [colors, tokens]);
  const [stations, setStations] = useState<any[]>([]);

  useEffect(() => {
    const processed = STATIONS_DATA.map((station) => {
      const mlResult = detectAnomalies(station.history, station.current);
      return { ...station, mlResult };
    });
    setStations(processed);
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: -1.8312,
          longitude: -78.1834,
          latitudeDelta: 4,
          longitudeDelta: 4,
        }}
      >
        {stations.map((s) => (
          <Marker key={s.id} coordinate={{ latitude: s.lat, longitude: s.lon }} pinColor={s.mlResult.color}>
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{s.name}</Text>
                <Text style={styles.calloutText}>Venta hoy: {s.current} gal</Text>
                <Text style={[styles.calloutStatus, { color: s.mlResult.color }]}>{s.mlResult.status}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <ScreenReveal delay={80}>
        <View style={styles.overlay}>
          <LinearGradient
            colors={tokens.stripeColors}
            locations={[0, 0.45, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardStripes}
          />
          <Text style={styles.title}>Mapa de monitoreo inteligente</Text>
          <Text style={styles.subtitle}>Detección de anomalías en tiempo real</Text>
        </View>
      </ScreenReveal>

      <ScreenReveal delay={120}>
        <View style={styles.legend}>
          <LinearGradient
            colors={tokens.stripeColors}
            locations={[0, 0.45, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardStripes}
          />
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
            <Text style={styles.legendText}>Normal</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.error }]} />
            <Text style={styles.legendText}>Excesivo</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.warning }]} />
            <Text style={styles.legendText}>Bajo</Text>
          </View>
        </View>
      </ScreenReveal>
    </View>
  );
}

const createStyles = (colors: ThemeColors, tokens: PremiumTokens) => StyleSheet.create({
  container: { flex: 1 },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  overlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: tokens.cardSurface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tokens.cardBorder,
    overflow: 'hidden',
  },
  title: { fontWeight: '700', fontSize: 16, color: colors.text, fontFamily: titleFont },
  subtitle: { fontSize: 12, color: colors.textLight, marginTop: 4 },
  callout: {
    width: 180,
    padding: 8,
    backgroundColor: tokens.cardSurface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: tokens.cardBorder,
  },
  calloutTitle: { fontWeight: '700', marginBottom: 5, color: colors.text, fontSize: 12 },
  calloutText: { fontSize: 11, color: colors.textLight },
  calloutStatus: { fontWeight: '700', marginTop: 6, fontSize: 11 },
  legend: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    backgroundColor: tokens.cardSurface,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.cardBorder,
    flexDirection: 'row',
    gap: 10,
    overflow: 'hidden',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { fontSize: 10, color: colors.textLight },
  dot: { width: 10, height: 10, borderRadius: 5 },
  cardStripes: {
    ...StyleSheet.absoluteFillObject,
    opacity: tokens.isDark ? 0.6 : 0.35,
  },
});
