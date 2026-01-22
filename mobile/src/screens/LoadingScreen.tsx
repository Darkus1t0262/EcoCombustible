import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/theme';
import type { ThemeColors } from '../theme/colors';
import type { PremiumTokens } from '../theme/premium';
import { getPremiumTokens } from '../theme/premium';

type Props = {
  label?: string;
};

const titleFont = Platform.select({ ios: 'Avenir Next', android: 'serif' });

export default function LoadingScreen({ label }: Props) {
  const { colors, resolvedMode } = useTheme();
  const tokens = useMemo(() => getPremiumTokens(colors, resolvedMode), [colors, resolvedMode]);
  const styles = useMemo(() => createStyles(colors, tokens), [colors, tokens]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={tokens.backgroundColors} style={styles.background} />
      <View style={styles.glowPrimary} />
      <View style={styles.glowSecondary} />

      <View style={styles.card}>
        <LinearGradient
          colors={tokens.stripeColors}
          locations={[0, 0.45, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardStripes}
        />
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

const createStyles = (colors: ThemeColors, tokens: PremiumTokens) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
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
    backgroundColor: tokens.cardSurface,
    borderWidth: 1,
    borderColor: tokens.cardBorder,
    shadowColor: '#000',
    shadowOpacity: tokens.shadowOpacity,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.cardSurface,
    borderWidth: 1,
    borderColor: tokens.cardBorder,
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
  cardStripes: {
    ...StyleSheet.absoluteFillObject,
    opacity: tokens.isDark ? 0.6 : 0.35,
  },
});
