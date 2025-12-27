import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

export default function StationDetailScreen({ route, navigation }: any) {
  const { station } = route.params;

  return (
    <View style={styles.container}>
      <View style={[styles.header, {backgroundColor: station.analysis.color}]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white"/>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{station.name}</Text>
      </View>

      <ScrollView style={{padding: 20}}>
        {/* Tarjeta de Estado IA */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Diagnóstico Inteligente (IA)</Text>
          <View style={{flexDirection:'row', alignItems:'center', gap:10, marginBottom:10}}>
             <Ionicons name="analytics" size={24} color={station.analysis.color} />
             <Text style={{fontWeight:'bold', color: station.analysis.color, fontSize:18}}>{station.analysis.status}</Text>
          </View>
          <Text style={{color:'#555'}}>{station.analysis.msg}</Text>
        </View>

        {/* Datos que vendrían de la APP DESPACHADOR */}
        <View style={styles.card}>
           <View style={{flexDirection:'row', justifyContent:'space-between'}}>
             <Text style={styles.sectionTitle}>Inventario & Ventas</Text>
             <Text style={{fontSize:10, color:COLORS.primary}}>Fuente: App Despachador</Text>
           </View>
           
           <View style={styles.row}>
             <View>
               <Text style={styles.label}>Stock Actual</Text>
               <Text style={styles.value}>{station.stock} Gal</Text>
             </View>
             <View>
               <Text style={styles.label}>Precio Venta</Text>
               <Text style={styles.value}>${station.price}</Text>
             </View>
           </View>
        </View>

        {/* Datos que vendrían de la APP CLIENTE */}
        <View style={styles.card}>
           <View style={{flexDirection:'row', justifyContent:'space-between'}}>
             <Text style={styles.sectionTitle}>Flujo Vehicular</Text>
             <Text style={{fontSize:10, color:COLORS.purple}}>Fuente: App Cliente</Text>
           </View>
           <Text style={styles.value}>1,240 Vehículos/Día</Text>
           <Text style={styles.label}>Registrados en plataforma</Text>
        </View>

        <TouchableOpacity 
            style={[styles.btn, {backgroundColor: COLORS.warning}]}
            onPress={() => navigation.navigate('Audit')}
        >
            <Text style={{fontWeight:'bold', color:'#333'}}>Iniciar Auditoría Manual</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, padding: 20, flexDirection: 'row', gap: 15, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 15, marginBottom: 15, elevation: 2 },
  sectionTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: '#666', fontSize: 12 },
  value: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  btn: { padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 }
});