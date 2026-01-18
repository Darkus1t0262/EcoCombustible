import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { ComplaintService } from '../../services/ComplaintService';

const titleFont = Platform.select({ ios: 'Avenir Next', android: 'serif' });

const parseNumber = (value: string) => {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

export default function NewComplaintScreen({ navigation }: any) {
  const [stationName, setStationName] = useState('');
  const [type, setType] = useState('');
  const [detail, setDetail] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterRole, setReporterRole] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [liters, setLiters] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    if (!stationName.trim() || !type.trim()) {
      setError('Estación y tipo son obligatorios.');
      return;
    }

    try {
      setLoading(true);
      await ComplaintService.createComplaint({
        stationName: stationName.trim(),
        type: type.trim(),
        detail: detail.trim() || null,
        reporterName: reporterName.trim() || null,
        reporterRole: reporterRole.trim() || null,
        vehiclePlate: vehiclePlate.trim() || null,
        vehicleModel: vehicleModel.trim() || null,
        fuelType: fuelType.trim() || null,
        liters: liters.trim() ? parseNumber(liters) : null,
        unitPrice: unitPrice.trim() ? parseNumber(unitPrice) : null,
      });
      navigation.goBack();
    } catch (err) {
      setError('No se pudo registrar la denuncia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerAction}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.title, { fontFamily: titleFont }]}>Nueva denuncia</Text>
          <Text style={styles.subtitle}>Registra una observación o irregularidad</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Datos principales</Text>
          <Text style={styles.label}>Estación *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre de la estación"
            placeholderTextColor={COLORS.textLight}
            value={stationName}
            onChangeText={setStationName}
          />

          <Text style={styles.label}>Tipo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Precio irregular"
            placeholderTextColor={COLORS.textLight}
            value={type}
            onChangeText={setType}
          />

          <Text style={styles.label}>Detalle</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe el problema"
            placeholderTextColor={COLORS.textLight}
            value={detail}
            onChangeText={setDetail}
            multiline
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Reportante</Text>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre y apellido"
            placeholderTextColor={COLORS.textLight}
            value={reporterName}
            onChangeText={setReporterName}
          />
          <Text style={styles.label}>Rol</Text>
          <TextInput
            style={styles.input}
            placeholder="Cliente / despachador"
            placeholderTextColor={COLORS.textLight}
            value={reporterRole}
            onChangeText={setReporterRole}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Vehículo (opcional)</Text>
          <Text style={styles.label}>Placa</Text>
          <TextInput
            style={styles.input}
            placeholder="ABC-1234"
            placeholderTextColor={COLORS.textLight}
            value={vehiclePlate}
            onChangeText={setVehiclePlate}
          />
          <Text style={styles.label}>Modelo</Text>
          <TextInput
            style={styles.input}
            placeholder="Marca y modelo"
            placeholderTextColor={COLORS.textLight}
            value={vehicleModel}
            onChangeText={setVehicleModel}
          />
          <Text style={styles.label}>Combustible</Text>
          <TextInput
            style={styles.input}
            placeholder="Diésel"
            placeholderTextColor={COLORS.textLight}
            value={fuelType}
            onChangeText={setFuelType}
          />
          <View style={styles.inlineRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Litros</Text>
              <TextInput
                style={styles.input}
                placeholder="0.0"
                placeholderTextColor={COLORS.textLight}
                keyboardType="decimal-pad"
                value={liters}
                onChangeText={setLiters}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Precio unitario</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={COLORS.textLight}
                keyboardType="decimal-pad"
                value={unitPrice}
                onChangeText={setUnitPrice}
              />
            </View>
          </View>
        </View>

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveText}>Guardar denuncia</Text>}
        </TouchableOpacity>
      </ScrollView>
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
  scroll: { padding: 20, paddingBottom: 30 },
  card: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    marginBottom: 14,
  },
  sectionTitle: { fontWeight: '700', fontSize: 14, color: COLORS.text, marginBottom: 10 },
  label: { fontSize: 12, color: COLORS.textLight, marginTop: 8, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    color: COLORS.text,
  },
  textArea: { height: 90, textAlignVertical: 'top' },
  inlineRow: { flexDirection: 'row', gap: 12 },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  saveText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  errorText: { color: COLORS.error, marginBottom: 10, textAlign: 'center' },
});
