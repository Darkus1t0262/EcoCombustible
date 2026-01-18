import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { AuthService } from '../../services/AuthService';
import { PushService } from '../../services/PushService';

const titleFont = Platform.select({ ios: 'Avenir Next', android: 'serif' });

export default function LoginScreen({ navigation }: any) {
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.heroGlow} />
            <View style={styles.heroGlowAlt} />

            <View style={styles.brandRow}>
              <View style={styles.brandIcon}>
                <MaterialCommunityIcons name="gas-station" size={24} color={COLORS.white} />
              </View>
              <View>
                <Text style={styles.brandTitle}>EcoCombustible</Text>
                <Text style={styles.brandSubtitle}>Control del subsidio de combustibles</Text>
              </View>
            </View>

            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Acceso regulador</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Inicio de sesión</Text>

            <Text style={styles.label}>Usuario</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="account" size={20} color={COLORS.textLight} />
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu usuario"
                placeholderTextColor={COLORS.textLight}
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
            </View>

            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="lock" size={20} color={COLORS.textLight} />
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu contraseña"
                placeholderTextColor={COLORS.textLight}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Ingresar</Text>}
            </TouchableOpacity>

            <View style={styles.demoRow}>
              <MaterialCommunityIcons name="information-outline" size={16} color={COLORS.textLight} />
              <Text style={styles.demoText}>Usuario demo: admin / admin123</Text>
            </View>
          </View>

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  hero: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    marginBottom: 20,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: `${COLORS.primary}1A`,
    top: -50,
    right: -60,
  },
  heroGlowAlt: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: `${COLORS.success}1A`,
    bottom: -40,
    left: -40,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginRight: 12,
  },
  brandTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, fontFamily: titleFont },
  brandSubtitle: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  heroBadge: {
    marginTop: 14,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceAlt,
  },
  heroBadgeText: { fontSize: 11, color: COLORS.textLight, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  label: { marginTop: 10, marginBottom: 6, fontWeight: '600', color: COLORS.textLight, fontSize: 12 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    paddingHorizontal: 12,
  },
  input: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, color: COLORS.text },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  demoRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  demoText: { fontSize: 12, color: COLORS.textLight },
  flagContainer: { marginTop: 28, alignItems: 'center' },
  flag: { flexDirection: 'row', height: 20, width: 70, borderRadius: 6, overflow: 'hidden', marginBottom: 6 },
  flagStripe: { height: '100%' },
  govText: { fontSize: 10, fontWeight: '700', color: COLORS.textLight },
  errorText: { color: COLORS.error, marginTop: 8 },
});
