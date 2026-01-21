import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/theme';
import type { ThemeColors } from '../../theme/colors';
import { ComplaintItem, ComplaintService } from '../../services/ComplaintService';
import { Skeleton } from '../../components/Skeleton';

const titleFont = Platform.select({ ios: 'Avenir Next', android: 'serif' });

const formatDate = (value?: string | null) => {
  if (!value) {
    return '--';
  }
  return value.replace('T', ' ').slice(0, 16);
};

export default function ComplaintDetailScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const statusLabels = useMemo(
    () => ({
      pending: { label: 'Pendiente', color: colors.error },
      resolved: { label: 'Resuelto', color: colors.success },
    }),
    [colors]
  );

  const { complaintId } = route.params;
  const [complaint, setComplaint] = useState<ComplaintItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const data = await ComplaintService.getComplaint(complaintId);
      setComplaint(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [complaintId]);

  const handleResolve = () => {
    Alert.alert('Confirmar', '¿Marcar denuncia como resuelta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Resolver',
        onPress: async () => {
          if (!complaint) {
            return;
          }
          try {
            setUpdating(true);
            await ComplaintService.updateStatus(complaint.id, 'resolved');
            await loadDetail();
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerAction}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.title, { fontFamily: titleFont }]}>Denuncia</Text>
            <Text style={styles.subtitle}>Detalle y seguimiento</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.card}>
            <Skeleton width="45%" height={14} />
            <Skeleton width="80%" height={10} style={{ marginTop: 12 }} />
            <Skeleton width="60%" height={10} style={{ marginTop: 8 }} />
          </View>
          <View style={styles.card}>
            <Skeleton width="40%" height={14} />
            <Skeleton width="70%" height={10} style={{ marginTop: 12 }} />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!complaint) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.error }}>No se encontró la denuncia.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: colors.white }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = statusLabels[complaint.status as keyof typeof statusLabels] ?? {
    label: complaint.status,
    color: colors.warning,
  };
  const photoUri = complaint.photoUrl ?? complaint.photoUri ?? null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerAction}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.title, { fontFamily: titleFont }]}>Denuncia</Text>
          <Text style={styles.subtitle}>Detalle y seguimiento</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{complaint.type}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${statusInfo.color}1A`, borderColor: `${statusInfo.color}33` },
              ]}
            >
              <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
            </View>
          </View>
          <Text style={styles.subtitleText}>{complaint.stationName}</Text>
          <Text style={styles.metaText}>Registrado: {formatDate(complaint.createdAt)}</Text>
          {!!complaint.source && <Text style={styles.metaText}>Fuente: {complaint.source}</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Detalle</Text>
          {!!complaint.detail && <Text style={styles.bodyText}>{complaint.detail}</Text>}
          {!complaint.detail && <Text style={styles.metaText}>Sin descripción adicional.</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Reportante</Text>
          <Text style={styles.metaText}>Usuario: {complaint.reporterName ?? 'No disponible'}</Text>
          <Text style={styles.metaText}>Rol: {complaint.reporterRole ?? 'No disponible'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Consumo y vehículo</Text>
          <Text style={styles.metaText}>Vehículo: {complaint.vehiclePlate ?? 'No disponible'}</Text>
          {!!complaint.vehicleModel && <Text style={styles.metaText}>Modelo: {complaint.vehicleModel}</Text>}
          {!!complaint.fuelType && <Text style={styles.metaText}>Combustible: {complaint.fuelType}</Text>}
          {!!complaint.liters && <Text style={styles.metaText}>Litros: {complaint.liters}</Text>}
          {!!complaint.unitPrice && <Text style={styles.metaText}>Precio unitario: ${complaint.unitPrice}</Text>}
          {!!complaint.totalAmount && <Text style={styles.metaText}>Total: ${complaint.totalAmount}</Text>}
          {!!complaint.occurredAt && <Text style={styles.metaText}>Ocurrió: {formatDate(complaint.occurredAt)}</Text>}
        </View>

        {!!photoUri && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Evidencia</Text>
            <Image source={{ uri: photoUri }} style={styles.photo} />
          </View>
        )}

        {!!complaint.resolutionNote && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Resolución</Text>
            <Text style={styles.metaText}>{complaint.resolutionNote}</Text>
            {!!complaint.resolvedAt && <Text style={styles.metaText}>Resuelta: {formatDate(complaint.resolvedAt)}</Text>}
          </View>
        )}

        <View style={styles.actionsRow}>
          {!!complaint.stationId && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('StationDetail', { stationId: complaint.stationId })}
            >
              <Text style={styles.actionText}>Ver estación</Text>
            </TouchableOpacity>
          )}
          {!!complaint.vehicleId && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
              onPress={() => navigation.navigate('VehicleDetail', { vehicleId: complaint.vehicleId })}
            >
              <Text style={styles.actionText}>Ver vehículo</Text>
            </TouchableOpacity>
          )}
          {!!complaint.transactionId && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.purple }]}
              onPress={() => navigation.navigate('TransactionDetail', { transactionId: complaint.transactionId })}
            >
              <Text style={styles.actionText}>Ver transacción</Text>
            </TouchableOpacity>
          )}
          {complaint.status !== 'resolved' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.success }]}
              onPress={handleResolve}
              disabled={updating}
            >
              <Text style={styles.actionText}>{updating ? 'Actualizando...' : 'Marcar resuelta'}</Text>
            </TouchableOpacity>
          )}
        </View>
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
  body: { padding: 20, paddingBottom: 30 },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderColor,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontWeight: '700', fontSize: 15, color: colors.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '700' },
  subtitleText: { color: colors.textLight, fontSize: 12, marginTop: 6 },
  sectionTitle: { fontWeight: '700', fontSize: 15, marginBottom: 8, color: colors.text },
  bodyText: { fontSize: 13, color: colors.textLight },
  metaText: { fontSize: 12, color: colors.textLight, marginTop: 4 },
  photo: { width: '100%', height: 200, borderRadius: 12, marginTop: 10 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10, marginBottom: 20 },
  actionBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  actionText: { color: colors.white, fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { marginTop: 12, backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
});
