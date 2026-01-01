import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { detectAnomalies } from '../../services/AnomalyDetection';

// DATOS MOCK (Simulando lo que vendría de tu Base de Datos Local SQLite)
// "history" son galones vendidos en los últimos 5 días
const STATIONS_DATA = [
  { 
    id: 1, name: "Petroecuador Norte (Quito)", lat: -0.1807, lon: -78.4678, 
    history: [1000, 1050, 980, 1020, 1010], current: 1000 // Normal
  },
  { 
    id: 2, name: "Gasolinera El Oro (Machala)", lat: -3.2581, lon: -79.9551, 
    history: [500, 520, 510, 490, 530], current: 2000 // ANOMALÍA: Muy alto (Contrabando?)
  },
  { 
    id: 3, name: "Primax Centro (Guayaquil)", lat: -2.1962, lon: -79.8862, 
    history: [800, 850, 820, 810, 830], current: 100 // ANOMALÍA: Muy bajo (No venta?)
  },
];

export default function StationsMap() {
  const [stations, setStations] = useState<any[]>([]);

  useEffect(() => {
    // Aquí procesamos los datos con la Inteligencia "Artificial" (Estadística)
    const processed = STATIONS_DATA.map(station => {
      const mlResult = detectAnomalies(station.history, station.current);
      return { ...station, mlResult };
    });
    setStations(processed);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        <Text style={styles.title}>Mapa de Monitoreo Inteligente</Text>
        <Text style={styles.subtitle}>Detección de anomalías en tiempo real</Text>
      </View>

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
          <Marker
            key={s.id}
            coordinate={{ latitude: s.lat, longitude: s.lon }}
            pinColor={s.mlResult.color} // El color lo define el ML
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{s.name}</Text>
                <Text>Venta Hoy: {s.current} gal</Text>
                <Text style={{ fontWeight: 'bold', color: s.mlResult.color, marginTop: 5 }}>
                  {s.mlResult.status}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      
      {/* Leyenda */}
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor:'green'}]}/><Text>Normal</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor:'red'}]}/><Text>Excesivo</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor:'orange'}]}/><Text>Bajo</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  overlay: { position: 'absolute', top: 50, left: 20, right: 20, backgroundColor: 'rgba(255,255,255,0.9)', padding: 15, borderRadius: 10, zIndex: 1 },
  title: { fontWeight: 'bold', fontSize: 16 },
  subtitle: { fontSize: 12, color: '#555' },
  callout: { width: 160, padding: 5 },
  calloutTitle: { fontWeight: 'bold', marginBottom: 5 },
  legend: { position: 'absolute', bottom: 30, left: 20, backgroundColor: 'white', padding: 10, borderRadius: 8, flexDirection: 'row', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5 }
});