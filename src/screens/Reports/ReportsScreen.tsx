import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

export default function ReportsScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24}/></TouchableOpacity>
        <Text style={styles.title}>Reportes Automáticos</Text>
      </View>

      <ScrollView style={{padding: 20}}>
        <View style={styles.card}>
          <Text style={{fontWeight:'bold', marginBottom:15}}>Generar Nuevo Reporte</Text>
          
          <Text style={styles.label}>Período</Text>
          <View style={{flexDirection:'row', backgroundColor:'#eee', borderRadius:8, padding:2, marginBottom:15}}>
             <TouchableOpacity style={[styles.tab, {backgroundColor: COLORS.primary}]}><Text style={{color:'white'}}>Semana</Text></TouchableOpacity>
             <TouchableOpacity style={styles.tab}><Text>Mes</Text></TouchableOpacity>
             <TouchableOpacity style={styles.tab}><Text>Año</Text></TouchableOpacity>
          </View>

          <Text style={styles.label}>Formato de Exportación</Text>
          <View style={{flexDirection:'row', gap:10, marginBottom:20}}>
             <TouchableOpacity style={[styles.exportBtn, {backgroundColor: COLORS.error}]}><Text style={{color:'white'}}>PDF</Text></TouchableOpacity>
             <TouchableOpacity style={[styles.exportBtn, {backgroundColor: COLORS.success}]}><Text style={{color:'white'}}>Excel</Text></TouchableOpacity>
             <TouchableOpacity style={[styles.exportBtn, {backgroundColor: COLORS.primary}]}><Text style={{color:'white'}}>CSV</Text></TouchableOpacity>
          </View>

          <TouchableOpacity style={{backgroundColor: COLORS.purple, padding:15, borderRadius:10, alignItems:'center', flexDirection:'row', justifyContent:'center'}}>
             <Ionicons name="document-text" color="white" size={20} style={{marginRight:10}} />
             <Text style={{color:'white', fontWeight:'bold'}}>Generar Reporte</Text>
          </TouchableOpacity>
        </View>

        <Text style={{fontWeight:'bold', marginTop:20, marginBottom:10}}>Reportes Recientes</Text>
        {[1,2,3].map(i => (
           <View key={i} style={styles.fileRow}>
              <View>
                 <Text style={{fontWeight:'bold'}}>Informe Mensual - Nov 2025</Text>
                 <Text style={{fontSize:12, color:'#888'}}>2025-11-30 • 2.4 MB</Text>
              </View>
              <Text style={{color: COLORS.primary}}>Descargar</Text>
           </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, padding: 20, backgroundColor: 'white', flexDirection: 'row', gap: 15, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 15 },
  label: { marginBottom: 10, color: '#555', fontWeight:'600' },
  tab: { flex: 1, alignItems: 'center', padding: 8, borderRadius: 6 },
  exportBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8 },
  fileRow: { backgroundColor:'white', padding:15, borderRadius:10, marginBottom:10, flexDirection:'row', justifyContent:'space-between', alignItems:'center' }
});