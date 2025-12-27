import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

export default function ComplaintsScreen({ navigation }: any) {
  const [form, setForm] = useState({ station: '', type: '', detail: '' });

  const sendComplaint = () => {
    if (!form.station || !form.type) {
      Alert.alert("Error", "Por favor complete los campos obligatorios.");
      return;
    }
    Alert.alert("Denuncia Recibida", "Se ha generado el ticket #T-2025-998. El equipo de auditoría ha sido notificado.");
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Registrar Denuncia</Text>
      </View>

      <ScrollView contentContainerStyle={{padding: 20}}>
        {/* Estadísticas Rápidas */}
        <View style={styles.statsRow}>
           <View style={styles.stat}>
             <Text style={{color:COLORS.success, fontWeight:'bold', fontSize:18}}>2</Text>
             <Text style={{fontSize:10, color:'#666'}}>Resueltas</Text>
           </View>
           <View style={styles.stat}>
             <Text style={{color:COLORS.error, fontWeight:'bold', fontSize:18}}>5</Text>
             <Text style={{fontSize:10, color:'#666'}}>Pendientes</Text>
           </View>
           <View style={styles.stat}>
             <Text style={{color:COLORS.primary, fontWeight:'bold', fontSize:18}}>8</Text>
             <Text style={{fontSize:10, color:'#666'}}>Totales</Text>
           </View>
        </View>

        {/* Formulario */}
        <View style={styles.card}>
          <View style={{flexDirection:'row', alignItems:'center', marginBottom:20}}>
             <Ionicons name="alert-circle" size={24} color={COLORS.error} />
             <Text style={{fontWeight:'bold', marginLeft:10, fontSize:16}}>Nueva Denuncia</Text>
          </View>

          <Text style={styles.label}>Nombre de la Estación *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ej: Gasolinera Centro" 
            placeholderTextColor="#999"
            value={form.station} 
            onChangeText={(t)=>setForm({...form, station:t})} 
          />

          <Text style={styles.label}>Tipo de Irregularidad *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ej: Precios adulterados" 
            placeholderTextColor="#999"
            value={form.type} 
            onChangeText={(t)=>setForm({...form, type:t})} 
          />

          <Text style={styles.label}>Descripción Detallada</Text>
          <TextInput 
            style={[styles.input, {height: 100, textAlignVertical:'top'}]} 
            multiline 
            placeholder="Describa los hechos con el mayor detalle posible..." 
            placeholderTextColor="#999"
            value={form.detail} 
            onChangeText={(t)=>setForm({...form, detail:t})} 
          />

          <Text style={styles.label}>Evidencia Fotográfica (Opcional)</Text>
          <TouchableOpacity style={styles.photoBox} onPress={() => Alert.alert("Cámara", "Abriendo cámara del dispositivo...")}>
             <Ionicons name="camera" size={30} color="#ccc" />
             <Text style={{color:'#aaa', marginTop:5, fontSize:12}}>Clic para subir imágenes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btn} onPress={sendComplaint}>
             <Ionicons name="paper-plane" size={20} color="white" style={{marginRight:10}} />
             <Text style={{color:'white', fontWeight:'bold', fontSize:16}}>Enviar Denuncia</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { 
    paddingTop: 50, 
    padding: 20, 
    backgroundColor: 'white', 
    flexDirection: 'row', 
    gap: 15, 
    alignItems: 'center',
    elevation: 2 
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  stat: { 
    backgroundColor: 'white', 
    padding: 15, 
    borderRadius: 10, 
    width: '31%', 
    alignItems: 'center', 
    elevation: 1 
  },
  card: { 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 15, 
    elevation: 2,
    marginBottom: 30
  },
  label: { marginBottom: 8, fontWeight: '600', color: '#444', fontSize: 14 },
  input: { 
    backgroundColor: '#F5F6FA', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#E0E0E0',
    color: '#333'
  },
  photoBox: { 
    height: 120, 
    backgroundColor: '#F9F9F9', 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 25, 
    borderStyle: 'dashed', 
    borderWidth: 1.5, 
    borderColor: '#ccc' 
  },
  btn: { 
    backgroundColor: COLORS.error, 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5
  }
});