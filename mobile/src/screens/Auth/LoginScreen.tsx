import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/theme';
import type { ThemeColors } from '../../theme/colors';
import type { PremiumTokens } from '../../theme/premium';
import { getPremiumTokens } from '../../theme/premium';
import { PressableScale } from '../../components/PressableScale';
import { ScreenReveal } from '../../components/ScreenReveal';
import { AuthService } from '../../services/AuthService';
import { PushService } from '../../services/PushService';

const titleFont = Platform.select({ ios: 'Avenir Next', android: 'serif' });

export default function LoginScreen({ navigation }: any) {
  const { colors, resolvedMode } = useTheme();
  const tokens = useMemo(() => getPremiumTokens(colors, resolvedMode), [colors, resolvedMode]);
  const styles = useMemo(() => createStyles(colors, tokens), [colors, tokens]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!username || !password) {
      setError('Ingresa usuario y contraseña.');
      return;
    }

    try {
      setLoading(true);
      await AuthService.login(username.trim(), password);
      navigation.replace('Dashboard');
      void PushService.registerDevice().catch(() => undefined);
    } catch (err) {
      setError('Credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={tokens.backgroundColors} style={styles.background} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ScreenReveal delay={60}>
            <View style={styles.hero}>
              <LinearGradient
                colors={tokens.stripeColors}
                locations={[0, 0.45, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardStripes}
              />
              <View style={styles.heroGlow} />
              <View style={styles.heroGlowAlt} />

              <View style={styles.brandRow}>
                <View style={styles.brandIcon}>
                  <Image source={require('../../../assets/logo.jpg')} style={styles.brandLogo} resizeMode="contain" />
                </View>
                <View style={styles.brandText}>
                  <Text style={styles.brandTitle} numberOfLines={1} ellipsizeMode="tail">
                    EcoCombustible
                  </Text>
                  <Text style={styles.brandSubtitle}>Control del subsidio de combustibles</Text>
                </View>
              </View>

              <View style={styles.heroBadge}>
                <MaterialCommunityIcons name="shield-check" size={14} color={colors.accent} />
                <Text style={styles.heroBadgeText}>Acceso regulador</Text>
              </View>
            </View>
          </ScreenReveal>

          <ScreenReveal delay={140}>
            <View style={styles.card}>
              <LinearGradient
                colors={tokens.stripeColors}
                locations={[0, 0.45, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardStripes}
              />
              <Text style={styles.cardTitle}>Inicio de sesión</Text>

              <Text style={styles.label}>Usuario</Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="account" size={20} color={colors.textLight} />
                <TextInput
                  style={styles.input}
                  placeholder="Ingresa tu usuario"
                  placeholderTextColor={colors.textLight}
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUsername}
                />
              </View>

              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="lock" size={20} color={colors.textLight} />
                <TextInput
                  style={styles.input}
                  placeholder="Ingresa tu contraseña"
                  placeholderTextColor={colors.textLight}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {!!error && <Text style={styles.errorText}>{error}</Text>}

              <PressableScale style={styles.button} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Ingresar</Text>}
              </PressableScale>

              <View style={styles.demoRow}>
                <MaterialCommunityIcons name="information-outline" size={16} color={colors.textLight} />
                <Text style={styles.demoText}>Usuario demo: admin / admin123</Text>
              </View>
            </View>
          </ScreenReveal>

          <View style={styles.flagContainer}>
            <View style={styles.flag}>
              <View style={[styles.flagStripe, { backgroundColor: '#FFD100', flex: 2 }]} />
              <View style={[styles.flagStripe, { backgroundColor: '#0033A0', flex: 1 }]} />
              <View style={[styles.flagStripe, { backgroundColor: '#EF3340', flex: 1 }]} />
            </View>
            <Text style={styles.govText}>Gobierno del Ecuador - ARCERNNR</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, tokens: PremiumTokens) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  hero: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: tokens.cardSurface,
    borderWidth: 1,
    borderColor: tokens.cardBorder,
    marginBottom: 20,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: `${colors.primary}1A`,
    top: -50,
    right: -60,
  },
  heroGlowAlt: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: `${colors.accent}1A`,
    bottom: -40,
    left: -40,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.cardSurface,
    marginRight: 12,
    borderWidth: 1,
    borderColor: tokens.cardBorder,
  },
  brandLogo: { width: 36, height: 36 },
  brandText: { flex: 1, minWidth: 0 },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    fontFamily: titleFont,
    includeFontPadding: false,
  },
  brandSubtitle: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  heroBadge: {
    marginTop: 14,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: tokens.cardSurface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: tokens.cardBorder,
  },
  heroBadgeText: { fontSize: 11, color: colors.textLight, fontWeight: '600' },
  card: {
    backgroundColor: tokens.cardSurface,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: tokens.cardBorder,
    shadowColor: '#000',
    shadowOpacity: tokens.shadowOpacity,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: 'hidden',
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 12 },
  label: { marginTop: 10, marginBottom: 6, fontWeight: '600', color: colors.textLight, fontSize: 12 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.cardSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.cardBorder,
    paddingHorizontal: 12,
  },
  input: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, color: colors.text },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  demoRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  demoText: { fontSize: 12, color: colors.textLight },
  flagContainer: { marginTop: 28, alignItems: 'center' },
  flag: { flexDirection: 'row', height: 20, width: 70, borderRadius: 6, overflow: 'hidden', marginBottom: 6 },
  flagStripe: { height: '100%' },
  govText: { fontSize: 10, fontWeight: '700', color: colors.textLight },
  errorText: { color: colors.error, marginTop: 8 },
  cardStripes: {
    ...StyleSheet.absoluteFillObject,
    opacity: tokens.isDark ? 0.6 : 0.35,
  },
});
