import { prisma } from '../lib/prisma.js';
import { sendExpoPushNotifications } from '../push.js';
import { EXPO_ACCESS_TOKEN, EXPO_PUSH_URL } from '../config/env.js';

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export const notifySupervisors = async (payload: PushPayload) => {
  const supervisors = await prisma.user.findMany({
    where: { role: 'supervisor' },
    select: { id: true },
  });
  const userIds = supervisors.map((user) => user.id);
  if (userIds.length === 0) {
    return;
  }

  const tokens = await prisma.deviceToken.findMany({
    where: { userId: { in: userIds }, active: true },
  });
  if (tokens.length === 0) {
    return;
  }

  const userIdsWithTokens = Array.from(new Set(tokens.map((token) => token.userId)));
  const notifications = await Promise.all(
    userIdsWithTokens.map((userId) =>
      prisma.notification.create({
        data: {
          userId,
          title: payload.title,
          body: payload.body,
          data: payload.data ?? {},
          status: 'queued',
        },
      })
    )
  );

  const notificationIdByUser = new Map<number, number>();
  for (const item of notifications) {
    if (item.userId) {
      notificationIdByUser.set(item.userId, item.id);
    }
  }

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

  const successTokens = new Set(
    results.filter((result) => result.status === 'ok').map((result) => result.token)
  );

  const successUserIds = new Set<number>();
  for (const token of tokens) {
    if (successTokens.has(token.token)) {
      successUserIds.add(token.userId);
    }
  }

  const successNotificationIds = userIdsWithTokens
    .filter((userId) => successUserIds.has(userId))
    .map((userId) => notificationIdByUser.get(userId))
    .filter((id): id is number => Boolean(id));

  const failedNotificationIds = userIdsWithTokens
    .filter((userId) => !successUserIds.has(userId))
    .map((userId) => notificationIdByUser.get(userId))
    .filter((id): id is number => Boolean(id));

  if (successNotificationIds.length > 0) {
    await prisma.notification.updateMany({
      where: { id: { in: successNotificationIds } },
      data: { status: 'sent', sentAt: new Date() },
    });
  }

  if (failedNotificationIds.length > 0) {
    await prisma.notification.updateMany({
      where: { id: { in: failedNotificationIds } },
      data: { status: 'failed', error: 'Push delivery failed' },
    });
  }

  const invalidTokens = results
    .filter((result) => {
      if (result.status !== 'error') {
        return false;
      }
      if (!result.details || typeof result.details !== 'object') {
        return false;
      }
      const details = result.details as { error?: string };
      return details.error === 'DeviceNotRegistered';
    })
    .map((result) => result.token);

  if (invalidTokens.length > 0) {
    await prisma.deviceToken.updateMany({
      where: { token: { in: invalidTokens } },
      data: { active: false },
    });
  }
};
