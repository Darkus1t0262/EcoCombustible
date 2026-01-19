import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

type Props = {
  label?: string;
};

const titleFont = Platform.select({ ios: 'Avenir Next', android: 'serif' });

export default function LoadingScreen({ label }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.glowPrimary} />
      <View style={styles.glowSecondary} />

      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="gas-station" size={26} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>EcoCombustible</Text>
        <Text style={styles.subtitle}>{label || 'Cargando datos...'}</Text>
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 14 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  glowPrimary: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: `${COLORS.primary}1A`,
    top: -40,
    right: -60,
  },
  glowSecondary: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: `${COLORS.success}14`,
    bottom: -20,
    left: -40,
  },
  card: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 24,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  title: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: titleFont,
  },
  subtitle: { marginTop: 6, color: COLORS.textLight, fontSize: 12 },
});
