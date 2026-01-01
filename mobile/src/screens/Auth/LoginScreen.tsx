import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { AuthService } from '../../services/AuthService';

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!username || !password) {
      setError('Please enter username and password.');
      return;
    }

    try {
      setLoading(true);
      await AuthService.login(username.trim(), password);
      navigation.replace('Dashboard');
    } catch (err) {
      setError('Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="gas-pump" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>EcoCombustible Regulador</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Login</Text>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter username"
            placeholderTextColor="#aaa"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            secureTextEntry
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
          />

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Sign In</Text>}
          </TouchableOpacity>
          <Text style={styles.footerText}>Demo user: admin / admin123</Text>
        </View>

        <View style={styles.flagContainer}>
          <View style={{ flexDirection: 'row', height: 20, width: 60, marginBottom: 5 }}>
            <View style={{ flex: 2, backgroundColor: '#FFD100' }} />
            <View style={{ flex: 1, backgroundColor: '#0033A0' }} />
            <View style={{ flex: 1, backgroundColor: '#EF3340' }} />
          </View>
          <Text style={styles.govText}>Gobierno del Ecuador - ARCERNNR</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D6E4FF' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  iconContainer: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 15 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, color: '#000' },
  card: { backgroundColor: 'white', width: '100%', padding: 25, borderRadius: 20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1 },
  cardTitle: { fontSize: 16, marginBottom: 20, color: '#555' },
  label: { marginBottom: 8, fontWeight: '600', color: '#333' },
  input: { backgroundColor: '#F5F6FA', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#E0E0E0' },
  button: { backgroundColor: '#2F60FF', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  footerText: { textAlign: 'center', marginTop: 15, fontSize: 12, color: '#888' },
  flagContainer: { marginTop: 40, alignItems: 'center' },
  govText: { fontSize: 10, fontWeight: 'bold' },
  errorText: { color: COLORS.error, marginBottom: 10 },
});
