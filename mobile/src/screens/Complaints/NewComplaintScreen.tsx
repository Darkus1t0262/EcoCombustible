import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/theme';
import type { ThemeColors } from '../../theme/colors';
import { ComplaintService } from '../../services/ComplaintService';
import { PressableScale } from '../../components/PressableScale';
import { ScreenReveal } from '../../components/ScreenReveal';

const titleFont = Platform.select({ ios: 'Avenir Next', android: 'serif' });

const parseNumber = (value: string) => {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

export default function NewComplaintScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
        <PressableScale onPress={() => navigation.goBack()} style={styles.headerAction}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </PressableScale>
        <View style={styles.headerText}>
          <Text style={[styles.title, { fontFamily: titleFont }]}>Nueva denuncia</Text>
          <Text style={styles.subtitle}>Registra una observación o irregularidad</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ScreenReveal delay={80}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Datos principales</Text>
            <Text style={styles.label}>Estación *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre de la estación"
              placeholderTextColor={colors.textLight}
              value={stationName}
              onChangeText={setStationName}
            />

            <Text style={styles.label}>Tipo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Precio irregular"
              placeholderTextColor={colors.textLight}
              value={type}
              onChangeText={setType}
            />

            <Text style={styles.label}>Detalle</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe el problema"
              placeholderTextColor={colors.textLight}
              value={detail}
              onChangeText={setDetail}
              multiline
            />
          </View>
        </ScreenReveal>

        <ScreenReveal delay={120}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Reportante</Text>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre y apellido"
              placeholderTextColor={colors.textLight}
              value={reporterName}
              onChangeText={setReporterName}
            />
            <Text style={styles.label}>Rol</Text>
            <TextInput
              style={styles.input}
              placeholder="Cliente / despachador"
              placeholderTextColor={colors.textLight}
              value={reporterRole}
              onChangeText={setReporterRole}
            />
          </View>
        </ScreenReveal>

        <ScreenReveal delay={160}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Vehículo (opcional)</Text>
            <Text style={styles.label}>Placa</Text>
            <TextInput
              style={styles.input}
              placeholder="ABC-1234"
              placeholderTextColor={colors.textLight}
              value={vehiclePlate}
              onChangeText={setVehiclePlate}
            />
            <Text style={styles.label}>Modelo</Text>
            <TextInput
              style={styles.input}
              placeholder="Marca y modelo"
              placeholderTextColor={colors.textLight}
              value={vehicleModel}
              onChangeText={setVehicleModel}
            />
            <Text style={styles.label}>Combustible</Text>
            <TextInput
              style={styles.input}
              placeholder="Diésel"
              placeholderTextColor={colors.textLight}
              value={fuelType}
              onChangeText={setFuelType}
            />
            <View style={styles.inlineRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Litros</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.0"
                  placeholderTextColor={colors.textLight}
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
                  placeholderTextColor={colors.textLight}
                  keyboardType="decimal-pad"
                  value={unitPrice}
                  onChangeText={setUnitPrice}
                />
              </View>
            </View>
          </View>
        </ScreenReveal>

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <PressableScale style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>Guardar denuncia</Text>}
        </PressableScale>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
  scroll: { padding: 20, paddingBottom: 30 },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderColor,
    marginBottom: 14,
  },
  sectionTitle: { fontWeight: '700', fontSize: 14, color: colors.text, marginBottom: 10 },
  label: { fontSize: 12, color: colors.textLight, marginTop: 8, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderColor,
    color: colors.text,
  },
  textArea: { height: 90, textAlignVertical: 'top' },
  inlineRow: { flexDirection: 'row', gap: 12 },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  saveText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  errorText: { color: colors.error, marginBottom: 10, textAlign: 'center' },
});
