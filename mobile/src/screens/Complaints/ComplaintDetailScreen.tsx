import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { ComplaintItem, ComplaintService } from '../../services/ComplaintService';

const formatDate = (value?: string | null) => {
  if (!value) {
    return '--';
  }
  return value.replace('T', ' ').slice(0, 16);
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: COLORS.error },
  resolved: { label: 'Resuelto', color: COLORS.success },
};

export default function ComplaintDetailScreen({ route, navigation }: any) {
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
    Alert.alert('Confirmar', 'Marcar denuncia como resuelta?', [
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!complaint) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: COLORS.error }}>No se encontro la denuncia.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: 'white' }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = statusLabels[complaint.status] ?? {
    label: complaint.status,
    color: COLORS.warning,
  };
  const photoUri = complaint.photoUrl ?? complaint.photoUri ?? null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Detalle de denuncia</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{complaint.type}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}>
              <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>{complaint.stationName}</Text>
          <Text style={styles.metaText}>Registrado: {formatDate(complaint.createdAt)}</Text>
          {!!complaint.source && <Text style={styles.metaText}>Fuente: {complaint.source}</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Detalle</Text>
          {!!complaint.detail && <Text style={styles.bodyText}>{complaint.detail}</Text>}
          {!complaint.detail && <Text style={styles.metaText}>Sin descripcion adicional.</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Reportante</Text>
          <Text style={styles.metaText}>Usuario: {complaint.reporterName ?? 'No disponible'}</Text>
          <Text style={styles.metaText}>Rol: {complaint.reporterRole ?? 'No disponible'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Consumo y vehiculo</Text>
          <Text style={styles.metaText}>Vehiculo: {complaint.vehiclePlate ?? 'No disponible'}</Text>
          {!!complaint.vehicleModel && <Text style={styles.metaText}>Modelo: {complaint.vehicleModel}</Text>}
          {!!complaint.fuelType && <Text style={styles.metaText}>Combustible: {complaint.fuelType}</Text>}
          {!!complaint.liters && <Text style={styles.metaText}>Litros: {complaint.liters}</Text>}
          {!!complaint.unitPrice && <Text style={styles.metaText}>Precio unitario: ${complaint.unitPrice}</Text>}
          {!!complaint.totalAmount && <Text style={styles.metaText}>Total: ${complaint.totalAmount}</Text>}
          {!!complaint.occurredAt && <Text style={styles.metaText}>Ocurrio: {formatDate(complaint.occurredAt)}</Text>}
        </View>

        {!!photoUri && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Evidencia</Text>
            <Image source={{ uri: photoUri }} style={styles.photo} />
          </View>
        )}

        {!!complaint.resolutionNote && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Resolucion</Text>
            <Text style={styles.metaText}>{complaint.resolutionNote}</Text>
            {!!complaint.resolvedAt && <Text style={styles.metaText}>Resuelta: {formatDate(complaint.resolvedAt)}</Text>}
          </View>
        )}

        <View style={styles.actionsRow}>
          {!!complaint.stationId && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
              onPress={() => navigation.navigate('StationDetail', { stationId: complaint.stationId })}
            >
              <Text style={styles.actionText}>Ver estacion</Text>
            </TouchableOpacity>
          )}
          {complaint.status !== 'resolved' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.success }]}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 50,
    padding: 20,
    backgroundColor: 'white',
    flexDirection: 'row',
    gap: 15,
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  card: { backgroundColor: 'white', padding: 18, borderRadius: 12, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontWeight: 'bold', fontSize: 16 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  subtitle: { color: '#666', fontSize: 12, marginTop: 6 },
  metaText: { fontSize: 12, color: '#555', marginTop: 4 },
  sectionTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  bodyText: { fontSize: 13, color: '#444' },
  photo: { width: '100%', height: 200, borderRadius: 10, marginTop: 10 },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 10, marginBottom: 20 },
  actionBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
  actionText: { color: 'white', fontWeight: 'bold' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { marginTop: 12, backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
});
