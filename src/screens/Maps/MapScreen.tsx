import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { COLORS, STATIONS_DB } from '../../theme/colors';
import { analyzeStationBehavior } from '../../services/DecisionEngine';
import { Ionicons } from '@expo/vector-icons';

export default function MapScreen({ navigation }: any) {
  const [filter, setFilter] = useState('Todas'); // Todas, Cumple, Alerta

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24}/></TouchableOpacity>
        <Text style={styles.title}>Mapa de Estaciones</Text>
      </View>

      {/* Filtros */}
      <View style={styles.filterContainer}>
        <Text style={{fontSize:12, marginRight:10, color:'#555'}}>Filtrar:</Text>
        <TouchableOpacity onPress={() => setFilter('Todas')} style={[styles.pill, {backgroundColor: COLORS.primary}]}><Text style={styles.pillText}>Todas</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('Cumplimiento')} style={[styles.pill, {backgroundColor: COLORS.success}]}><Text style={styles.pillText}>Cumple</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('Observacion')} style={[styles.pill, {backgroundColor: COLORS.warning}]}><Text style={styles.pillText}>Obs</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('Infraccion')} style={[styles.pill, {backgroundColor: COLORS.error}]}><Text style={styles.pillText}>Infra</Text></TouchableOpacity>
      </View>

      <MapView 
        style={styles.map} 
        initialRegion={{latitude: -1.8312, longitude: -78.1834, latitudeDelta: 5, longitudeDelta: 5}}
      >
        {STATIONS_DB.map((s) => {
          const analysis = analyzeStationBehavior(s);
          if (filter !== 'Todas' && s.status !== filter) return null;

          return (
            <Marker key={s.id} coordinate={{latitude: s.lat, longitude: s.lng}} pinColor={analysis.color}>
              <Callout>
                <View style={{width: 200, padding: 5}}>
                  <Text style={{fontWeight:'bold'}}>{s.name}</Text>
                  <Text style={{color: analysis.color, fontWeight:'bold', marginVertical:5}}>{analysis.status}</Text>
                  <Text style={{fontSize:10}}>IA: {analysis.msg}</Text>
                </View>
              </Callout>
            </Marker>
          )
        })}
      </MapView>

      <View style={styles.legend}>
        <Text style={{fontWeight:'bold', fontSize:12, marginBottom:5}}>Leyenda IA</Text>
        <View style={styles.row}><View style={[styles.dot, {backgroundColor: COLORS.success}]}/><Text style={styles.legText}>Normal</Text></View>
        <View style={styles.row}><View style={[styles.dot, {backgroundColor: COLORS.warning}]}/><Text style={styles.legText}>Posible Contrabando</Text></View>
        <View style={styles.row}><View style={[styles.dot, {backgroundColor: COLORS.error}]}/><Text style={styles.legText}>Infracción Precio</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, padding: 20, backgroundColor: 'white', flexDirection: 'row', gap: 15, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold' },
  map: { flex: 1 },
  filterContainer: { position:'absolute', top: 110, left: 10, right: 10, zIndex: 10, flexDirection:'row', alignItems:'center', backgroundColor:'rgba(255,255,255,0.9)', padding:10, borderRadius:10 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginHorizontal: 3 },
  pillText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  legend: { position: 'absolute', bottom: 30, right: 20, backgroundColor: 'white', padding: 15, borderRadius: 10, elevation: 5 },
  row: { flexDirection:'row', alignItems:'center', marginVertical: 2 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legText: { fontSize: 10 }
});