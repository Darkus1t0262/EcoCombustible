import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { ComplaintService } from '../../services/ComplaintService';
import { deleteFileAsync, saveImageAsync } from '../../services/MediaStorage';

export default function ComplaintsScreen({ navigation }: any) {
  const [form, setForm] = useState({ stationName: '', type: '', detail: '' });
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });

  const loadStats = async () => {
    const data = await ComplaintService.getStats();
    setStats(data);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const sendComplaint = async () => {
    if (!form.stationName || !form.type) {
      Alert.alert('Error', 'Please complete required fields.');
      return;
    }
    setLoading(true);
    await ComplaintService.createComplaint({
      stationName: form.stationName.trim(),
      type: form.type.trim(),
      detail: form.detail.trim(),
      photoUri,
    });
    setLoading(false);
    setForm({ stationName: '', type: '', detail: '' });
    setPhotoUri(null);
    await loadStats();
    Alert.alert('Complaint saved', 'Ticket created and queued for review.');
  };

  const requestPermission = async (source: 'camera' | 'library') => {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const handlePick = async (source: 'camera' | 'library') => {
    const ok = await requestPermission(source);
    if (!ok) {
      Alert.alert('Permiso requerido', 'Habilita el permiso para continuar.');
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    try {
      const saved = await saveImageAsync(asset.uri);
      await deleteFileAsync(photoUri);
      setPhotoUri(saved);
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la imagen.');
    }
  };

  const openPicker = () => {
    Alert.alert('Adjuntar foto', 'Selecciona una opcion', [
      { text: 'Camara', onPress: () => handlePick('camera') },
      { text: 'Galeria', onPress: () => handlePick('library') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const clearPhoto = async () => {
    await deleteFileAsync(photoUri);
    setPhotoUri(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Register Complaint</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={{ color: COLORS.success, fontWeight: 'bold', fontSize: 18 }}>{stats.resolved}</Text>
            <Text style={{ fontSize: 10, color: '#666' }}>Resolved</Text>
          </View>
          <View style={styles.stat}>
            <Text style={{ color: COLORS.error, fontWeight: 'bold', fontSize: 18 }}>{stats.pending}</Text>
            <Text style={{ fontSize: 10, color: '#666' }}>Pending</Text>
          </View>
          <View style={styles.stat}>
            <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 18 }}>{stats.total}</Text>
            <Text style={{ fontSize: 10, color: '#666' }}>Total</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <Ionicons name="alert-circle" size={24} color={COLORS.error} />
            <Text style={{ fontWeight: 'bold', marginLeft: 10, fontSize: 16 }}>New Complaint</Text>
          </View>

          <Text style={styles.label}>Station Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Example: Gasolinera Centro"
            placeholderTextColor="#999"
            value={form.stationName}
            onChangeText={(t) => setForm({ ...form, stationName: t })}
          />

          <Text style={styles.label}>Issue Type *</Text>
          <TextInput
            style={styles.input}
            placeholder="Example: Altered prices"
            placeholderTextColor="#999"
            value={form.type}
            onChangeText={(t) => setForm({ ...form, type: t })}
          />

          <Text style={styles.label}>Details</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            multiline
            placeholder="Describe the incident..."
            placeholderTextColor="#999"
            value={form.detail}
            onChangeText={(t) => setForm({ ...form, detail: t })}
          />

          <Text style={styles.label}>Photo Evidence (Optional)</Text>
          <TouchableOpacity style={styles.photoBox} onPress={openPicker}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            ) : (
              <>
                <Ionicons name="camera" size={30} color="#ccc" />
                <Text style={{ color: '#aaa', marginTop: 5, fontSize: 12 }}>Tap to upload image</Text>
              </>
            )}
          </TouchableOpacity>
          {!!photoUri && (
            <TouchableOpacity style={styles.removePhoto} onPress={clearPhoto}>
              <Text style={{ color: COLORS.error, fontWeight: 'bold' }}>Remove photo</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.btn} onPress={sendComplaint} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={20} color="white" style={{ marginRight: 10 }} />
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Submit</Text>
              </>
            )}
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
    elevation: 2,
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  stat: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    width: '31%',
    alignItems: 'center',
    elevation: 1,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    elevation: 2,
    marginBottom: 30,
  },
  label: { marginBottom: 8, fontWeight: '600', color: '#444', fontSize: 14 },
  input: {
    backgroundColor: '#F5F6FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
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
    borderColor: '#ccc',
  },
  photoPreview: { width: '100%', height: '100%', borderRadius: 10 },
  removePhoto: { alignItems: 'center', marginBottom: 20 },
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
    elevation: 5,
  },
});
