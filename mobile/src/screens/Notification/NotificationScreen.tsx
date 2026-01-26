import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../theme/theme';
import type { ThemeColors } from '../../theme/colors';
import { NotificationsService, NotificationItem } from '../../services/NotificationsService';

export default function NotificationsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await NotificationsService.getNotifications();
        setNotifications(data);
      } catch (error) {
        console.error('Error loading notifications', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Notificaciones</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : notifications.length === 0 ? (
          <Text style={styles.empty}>No tienes notificaciones.</Text>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.notificationItem}>
                <Ionicons
                  name="notifications-outline"
                  size={18}
                  color={colors.primary}
                />
                <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                    <Text style={styles.notificationBody}>{item.body}</Text>

                    {item.data?.priceExpected !== undefined &&
                      item.data?.priceReported !== undefined && (
                        <View style={{ marginTop: 6 }}>
                          <Text style={styles.notificationExtra}>
                            Precio esperado: ${item.data.priceExpected.toFixed(2)}
                          </Text>
                          <Text style={styles.notificationExtra}>
                            Precio reportado: ${item.data.priceReported.toFixed(2)}
                          </Text>
                      
                          {item.data.priceReported > item.data.priceExpected ? (
                            <Text style={[styles.notificationExtra, { color: colors.error }]}>
                              ❌ Precio mayor al autorizado
                            </Text>
                          ) : (
                            <Text style={[styles.notificationExtra, { color: colors.success }]}>
                              ✅ Precio dentro de lo permitido
                            </Text>
                          )}
                        </View>
                      )}

                    <Text style={styles.notificationDate}>
                      {new Date(item.createdAt).toLocaleString()}
                    </Text>
                  </View>
  
              </View>
            )}
          />
        )}

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back-outline" size={18} color={colors.error} />
          <Text style={styles.backBtnText}>Atrás</Text>
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
      maxHeight: '90%',
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 16,
      color: colors.text,
    },
    empty: {
      textAlign: 'center',
      color: colors.textLight,
      marginVertical: 20,
      fontSize: 13,
    },
    notificationItem: {
      flexDirection: 'row',
      gap: 12,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderColor,
      backgroundColor: colors.surfaceAlt,
      marginBottom: 10,
    },
    notificationContent: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    notificationBody: {
      fontSize: 12,
      color: colors.textLight,
      marginTop: 2,
    },
    notificationDate: {
      fontSize: 11,
      color: colors.textLight,
      marginTop: 4,
    },
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
    notificationExtra: {
  fontSize: 11,
  color: colors.textLight,
  marginTop: 2,
  },

});
