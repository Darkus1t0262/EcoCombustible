import { prisma } from '../lib/prisma.js';
import { sendExpoPushNotifications } from '../push.js';
import { EXPO_ACCESS_TOKEN, EXPO_PUSH_URL } from '../config/env.js';
import { notificationQueue } from '../lib/queue.js';

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

/* =========================================================
   🔔 NOTIFICAR A SUPERVISOR ESPECÍFICO (NO A TODOS)
   ========================================================= */
export const notifySupervisors = async (payload: PushPayload) => {
  const targetUserId = payload.data?.targetUserId as number | undefined;

  if (!targetUserId) {
    console.warn('[Notification] ⚠️ targetUserId no definido');
    return;
  }

  // Buscar tokens del supervisor asignado
  const tokens = await prisma.deviceToken.findMany({
    where: {
      userId: targetUserId,
      active: true,
    },
  });

  // Guardar notificación en BD (aunque no tenga tokens)
  const notification = await prisma.notification.create({
    data: {
      userId: targetUserId,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      status: 'queued',
    },
  });

  if (tokens.length === 0) {
    return;
  }

  // Enviar push notification
  const results = await sendExpoPushNotifications({
    messages: tokens.map((token) => ({
      to: token.token,
      title: payload.title,
      body: payload.body,
      data: payload.data,
    })),
    accessToken: EXPO_ACCESS_TOKEN,
    apiUrl: EXPO_PUSH_URL,
  });

  const success = results.some((r) => r.status === 'ok');

  await prisma.notification.update({
    where: { id: notification.id },
    data: success
      ? { status: 'sent', sentAt: new Date() }
      : { status: 'failed', error: 'Push delivery failed' },
  });

  // Invalidar tokens rotos
  const invalidTokens = results
    .filter(
      (r) =>
        r.status === 'error' &&
        typeof r.details === 'object' &&
        (r.details as any)?.error === 'DeviceNotRegistered'
    )
    .map((r) => r.token);

  if (invalidTokens.length > 0) {
    await prisma.deviceToken.updateMany({
      where: { token: { in: invalidTokens } },
      data: { active: false },
    });
  }
};

/* =========================================================
   📥 ENCOLAR NOTIFICACIÓN A SUPERVISOR
   ========================================================= */
export const enqueueSupervisorNotification = async (payload: PushPayload) => {
  await notificationQueue.add('notify-supervisors', payload, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 100,
  });
};

/* =========================================================
   🔔 NOTIFICAR AL ADMIN (UNO SOLO)
   ========================================================= */
export const notifyAdmin = async (payload: PushPayload) => {
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' },
    select: { id: true },
  });

  if (!admin) {
    console.warn('[Notification] ⚠️ No se encontró admin');
    return;
  }

  const tokens = await prisma.deviceToken.findMany({
    where: {
      userId: admin.id,
      active: true,
    },
  });

  // Crear notificación en BD
  const notification = await prisma.notification.create({
    data: {
      userId: admin.id,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      status: 'queued',
    },
  });

  if (tokens.length === 0) {
    return;
  }

  // Enviar push
  const results = await sendExpoPushNotifications({
    messages: tokens.map((token) => ({
      to: token.token,
      title: payload.title,
      body: payload.body,
      data: payload.data,
    })),
    accessToken: EXPO_ACCESS_TOKEN,
    apiUrl: EXPO_PUSH_URL,
  });

  const success = results.some((r) => r.status === 'ok');

  await prisma.notification.update({
    where: { id: notification.id },
    data: success
      ? { status: 'sent', sentAt: new Date() }
      : { status: 'failed', error: 'Push delivery failed' },
  });

  // Invalidar tokens rotos
  const invalidTokens = results
    .filter(
      (r) =>
        r.status === 'error' &&
        typeof r.details === 'object' &&
        (r.details as any)?.error === 'DeviceNotRegistered'
    )
    .map((r) => r.token);

  if (invalidTokens.length > 0) {
    await prisma.deviceToken.updateMany({
      where: { token: { in: invalidTokens } },
      data: { active: false },
    });
  }
};

/* =========================================================
   📥 ENCOLAR NOTIFICACIÓN AL ADMIN
   ========================================================= */
export const enqueueAdminNotification = async (payload: PushPayload) => {
  await notificationQueue.add('notify-admin', payload, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 100,
  });
};
