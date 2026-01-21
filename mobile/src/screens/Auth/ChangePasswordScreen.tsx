import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../theme/theme';
import type { ThemeColors } from '../../theme/colors';
import { AuthService } from '../../services/AuthService';

export default function ChangePasswordScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword) {
      setError('Completa todos los campos.');
      return;
    }

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      await AuthService.changePassword(currentPassword, newPassword);
      setSuccess('Contraseña actualizada correctamente.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setError(err?.message || 'Error al cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Cambiar contraseña</Text>

        <Text style={styles.label}>Contraseña actual</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Ingresa tu contraseña actual"
          placeholderTextColor={colors.textLight}
        />

        <Text style={styles.label}>Nueva contraseña</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Ingresa la nueva contraseña"
          placeholderTextColor={colors.textLight}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}
        {!!success && <Text style={styles.success}>{success}</Text>}

        {/* 🔙 BOTÓN ATRÁS */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back-outline" size={18} color={colors.error} />
          <Text style={styles.backBtnText}>Atrás</Text>
        </TouchableOpacity>

        {/* 💾 BOTÓN GUARDAR */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleChangePassword}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <View style={styles.buttonContent}>
              <Ionicons name="save-outline" size={18} color={colors.white} />
              <Text style={styles.buttonText}>Guardar</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      padding: 20,
    },
    card: {
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderColor,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 16,
      color: colors.text,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      marginTop: 10,
      color: colors.textLight,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.borderColor,
      borderRadius: 10,
      padding: 12,
      marginTop: 6,
      color: colors.text,
      backgroundColor: colors.surfaceAlt,
    },
    error: {
      color: colors.error,
      marginTop: 10,
      fontSize: 12,
    },
    success: {
      color: colors.success,
      marginTop: 10,
      fontSize: 12,
    },

    /* 🔙 BOTÓN ATRÁS */
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 16,
      borderWidth: 1,
      borderColor: `${colors.error}40`,
      backgroundColor: `${colors.error}12`,
    },
    backBtnText: {
      color: colors.error,
      fontWeight: '600',
    },

    /* 💾 BOTÓN GUARDAR */
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      marginTop: 12,
      alignItems: 'center',
    },
    buttonText: {
      color: colors.white,
      fontWeight: '700',
    },
    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
  });
