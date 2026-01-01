import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { StationService } from '../../services/ApiSync';
import { analyzeStationBehavior } from '../../services/DecisionEngine';

export default function StationDetailScreen({ route, navigation }: any) {
  const { stationId } = route.params;
  const [station, setStation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await StationService.getStationDetails(stationId);
      if (data) {
        setStation({ ...data, analysis: analyzeStationBehavior(data) });
      }
      setLoading(false);
    };
    load();
  }, [stationId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!station) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: COLORS.error }}>Station not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: 'white' }}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: station.analysis.color }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{station.name}</Text>
      </View>

      <ScrollView style={{ padding: 20 }}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>AI Diagnostic</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Ionicons name="analytics" size={24} color={station.analysis.color} />
            <Text style={{ fontWeight: 'bold', color: station.analysis.color, fontSize: 18 }}>{station.analysis.status}</Text>
          </View>
          <Text style={{ color: '#555' }}>{station.analysis.msg}</Text>
        </View>

        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.sectionTitle}>Inventory and Sales</Text>
            <Text style={{ fontSize: 10, color: COLORS.primary }}>Source: Local DB</Text>
          </View>

          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Current Stock</Text>
              <Text style={styles.value}>{station.stock} gal</Text>
            </View>
            <View>
              <Text style={styles.label}>Sale Price</Text>
              <Text style={styles.value}>${station.price}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.sectionTitle}>Vehicle Flow</Text>
            <Text style={{ fontSize: 10, color: COLORS.purple }}>Source: Local DB</Text>
          </View>
          <Text style={styles.value}>1,240 vehicles/day</Text>
          <Text style={styles.label}>Registered on platform</Text>
        </View>

        <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.warning }]} onPress={() => navigation.navigate('Audit')}>
          <Text style={{ fontWeight: 'bold', color: '#333' }}>Start Manual Audit</Text>
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
  btn: { padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { marginTop: 12, backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
});
