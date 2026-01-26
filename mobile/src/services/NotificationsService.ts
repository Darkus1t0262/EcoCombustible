import { USE_REMOTE_AUTH } from '../config/env';
import { apiFetch } from './ApiClient';
import { SecureSession } from './SecureSession';

export type NotificationItem = {
  id: number;
  title: string;
  body: string;
  type: 'AUDIT_APPROVED' | 'AUDIT_REJECTED';
  createdAt: string;
  readAt?: string | null;

  data?: {
    priceExpected?: number;
    priceReported?: number;
    supervisorUsername?: string;
    stationName?: string;
    auditId?: number;
    newStatus?: string;
  };
};


export const NotificationsService = {
  /**
   * Obtiene las notificaciones del usuario autenticado
   */
  getNotifications: async (): Promise<NotificationItem[]> => {
    if (!USE_REMOTE_AUTH) {
      // En modo local no hay backend ni notificaciones
      return [];
    }

    const session = await SecureSession.get();
    if (!session?.token) {
      throw new Error('No session');
    }

    return await apiFetch<NotificationItem[]>('/notifications');
  },

  /**
   * Marca una notificación como leída
   */
  markAsRead: async (notificationId: number): Promise<void> => {
    if (!USE_REMOTE_AUTH) {
      return;
    }

    const session = await SecureSession.get();
    if (!session?.token) {
      throw new Error('No session');
    }

    await apiFetch<void>(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },
};
