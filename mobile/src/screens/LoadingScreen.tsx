import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, Image } from 'react-native';
import { useTheme } from '../theme/theme';
import type { ThemeColors } from '../theme/colors';

type Props = {
  label?: string;
};

const titleFont = Platform.select({ ios: 'Avenir Next', android: 'serif' });

export default function LoadingScreen({ label }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.glowPrimary} />
      <View style={styles.glowSecondary} />

      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Image source={require('../../assets/logo.jpg')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.title}>EcoCombustible</Text>
        <Text style={styles.subtitle}>{label || 'Cargando datos...'}</Text>
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 14 }} />
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  glowPrimary: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: `${colors.primary}1A`,
    top: -40,
    right: -60,
  },
  glowSecondary: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: `${colors.success}14`,
    bottom: -20,
    left: -40,
  },
  card: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 24,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderColor,
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
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  logo: { width: 36, height: 36 },
  title: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    fontFamily: titleFont,
  },
  subtitle: { marginTop: 6, color: colors.textLight, fontSize: 12 },
});
