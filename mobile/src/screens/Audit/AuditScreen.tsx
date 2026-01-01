import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { AuditService, AuditItem } from '../../services/AuditService';

export default function AuditScreen({ navigation }: any) {
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAudits = async () => {
    setLoading(true);
    const data = await AuditService.getAudits();
    setAudits(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAudits();
  }, []);

  const handleUpdate = (auditId: number, status: 'approved' | 'rejected') => {
    Alert.alert('Confirm', `Mark audit as ${status}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'OK',
        onPress: async () => {
          await AuditService.updateAuditStatus(auditId, status);
          await loadAudits();
        },
      },
    ]);
  };

  const total = audits.length;
  const approved = audits.filter((a) => a.status === 'approved').length;
  const pending = audits.filter((a) => a.status === 'pending').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Remote Audits</Text>
      </View>

      <ScrollView style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <View style={styles.statBox}>
            <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 18 }}>{total}</Text>
            <Text style={{ fontSize: 10 }}>Total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={{ color: COLORS.success, fontWeight: 'bold', fontSize: 18 }}>{approved}</Text>
            <Text style={{ fontSize: 10 }}>Approved</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={{ color: COLORS.error, fontWeight: 'bold', fontSize: 18 }}>{pending}</Text>
            <Text style={{ fontSize: 10 }}>Pending</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          audits.map((audit) => (
            <View key={audit.id} style={styles.card}>
              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{audit.stationName}</Text>
              <Text style={{ color: COLORS.primary, fontSize: 12, marginBottom: 10 }}>
                Status: {audit.status.toUpperCase()}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>Code: {audit.code}</Text>

              <View style={styles.checkItem}>
                <View>
                  <Text style={{ fontWeight: 'bold' }}>Fuel Price</Text>
                  <Text style={{ fontSize: 12 }}>
                    Expected: ${audit.priceExpected} | Reported: ${audit.priceReported}
                  </Text>
                </View>
                <Ionicons
                  name={audit.priceExpected === audit.priceReported ? 'checkmark-circle' : 'alert-circle'}
                  size={24}
                  color={audit.priceExpected === audit.priceReported ? COLORS.success : COLORS.error}
                />
              </View>

              <View style={styles.checkItem}>
                <View>
                  <Text style={{ fontWeight: 'bold' }}>Dispenser Calibration</Text>
                  <Text style={{ fontSize: 12 }}>Status: {audit.dispenserOk ? 'OK' : 'Issue'}</Text>
                </View>
                <Ionicons
                  name={audit.dispenserOk ? 'checkmark-circle' : 'alert-circle'}
                  size={24}
                  color={audit.dispenserOk ? COLORS.success : COLORS.error}
                />
              </View>

              {audit.status === 'pending' && (
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: COLORS.success }]}
                    onPress={() => handleUpdate(audit.id, 'approved')}
                  >
                    <Text style={styles.btnTxt}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: COLORS.error }]}
                    onPress={() => handleUpdate(audit.id, 'rejected')}
                  >
                    <Text style={styles.btnTxt}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, padding: 20, backgroundColor: 'white', flexDirection: 'row', gap: 15, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold' },
  statBox: { backgroundColor: 'white', padding: 15, borderRadius: 10, width: '30%', alignItems: 'center' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 15, marginTop: 10 },
  checkItem: { backgroundColor: '#F9F9F9', padding: 15, borderRadius: 10, marginTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  btn: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center' },
  btnTxt: { color: 'white', fontWeight: 'bold' },
});
