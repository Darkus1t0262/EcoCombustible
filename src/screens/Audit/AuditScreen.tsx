import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

export default function AuditScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
       <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24}/></TouchableOpacity>
        <Text style={styles.title}>Auditoría Remota</Text>
      </View>

      <ScrollView style={{padding: 20}}>
        {/* Stats */}
        <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:20}}>
          <View style={styles.statBox}><Text style={{color:COLORS.primary, fontWeight:'bold', fontSize:18}}>156</Text><Text style={{fontSize:10}}>Total</Text></View>
          <View style={styles.statBox}><Text style={{color:COLORS.success, fontWeight:'bold', fontSize:18}}>142</Text><Text style={{fontSize:10}}>Aprob.</Text></View>
          <View style={styles.statBox}><Text style={{color:COLORS.error, fontWeight:'bold', fontSize:18}}>3</Text><Text style={{fontSize:10}}>Pend.</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={{fontWeight:'bold', fontSize:16}}>Estación Petroecuador Norte</Text>
          <Text style={{color:COLORS.primary, fontSize:12, marginBottom:10}}>Pendiente de Validación</Text>
          <Text style={{fontSize:12, color:'#666'}}>Código: AUD-2025-156</Text>

          <View style={styles.checkItem}>
             <View>
               <Text style={{fontWeight:'bold'}}>Precio Gasolina Súper</Text>
               <Text style={{fontSize:12}}>Esperado: $2.55 | Reportado: $2.55</Text>
             </View>
             <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
          </View>

          <View style={styles.checkItem}>
             <View>
               <Text style={{fontWeight:'bold'}}>Calibración Dispensador</Text>
               <Text style={{fontSize:12}}>Margen Error: 0.1%</Text>
             </View>
             <Switch value={true} trackColor={{true: COLORS.success}} thumbColor="white"/>
          </View>

          <View style={{flexDirection:'row', gap: 10, marginTop: 20}}>
             <TouchableOpacity style={[styles.btn, {backgroundColor: COLORS.success}]} onPress={() => alert('Aprobado')}>
               <Text style={styles.btnTxt}>Aprobar Auditoría</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.btn, {backgroundColor: COLORS.error}]} onPress={() => alert('Rechazado')}>
               <Text style={styles.btnTxt}>Rechazar</Text>
             </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, padding: 20, backgroundColor: 'white', flexDirection: 'row', gap: 15, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold' },
  statBox: { backgroundColor:'white', padding:15, borderRadius:10, width:'30%', alignItems:'center' },
  card: { backgroundColor:'white', padding:20, borderRadius:15, marginTop:10 },
  checkItem: { backgroundColor:'#F9F9F9', padding:15, borderRadius:10, marginTop:15, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  btn: { flex: 1, padding: 15, borderRadius: 8, alignItems:'center' },
  btnTxt: { color: 'white', fontWeight: 'bold' }
});