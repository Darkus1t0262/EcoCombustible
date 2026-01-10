import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { USE_REMOTE_AUTH } from '../config/env';
import { apiFetch } from './ApiClient';

let handlerConfigured = false;

const configureNotifications = async () => {
  if (!handlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    handlerConfigured = true;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
};

export const PushService = {
  registerDevice: async (): Promise<void> => {
    if (!USE_REMOTE_AUTH) {
      return;
    }

    if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
      return;
    }

    await configureNotifications();

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;

    if (status !== 'granted') {
      const request = await Notifications.requestPermissionsAsync();
      status = request.status;
    }

    if (status !== 'granted') {
      return;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    const token = tokenResponse.data;

    if (!token) {
      return;
    }

    await apiFetch('/devices/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        platform: Platform.OS,
      }),
    });
  },
};
