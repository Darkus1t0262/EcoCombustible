import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { isValidExpoPushToken } from '../push.js';
import { enqueueSupervisorNotification } from '../services/notifications.js';
import { enqueueAdminNotification } from '../services/notifications.js';

export const registerNotificationRoutes = async (fastify: FastifyInstance) => {
  fastify.post('/devices/register', { preHandler: [authenticate] }, async (request, reply) => {
    const bodySchema = z.object({
      token: z.string().min(1),
      platform: z.enum(['ios', 'android']),
    });
    const body = bodySchema.parse(request.body);
    const token = body.token.trim();

    if (!isValidExpoPushToken(token)) {
      return reply.code(400).send({ error: 'Invalid Expo push token' });
    }

    const user = request.user as { id: number };
    const now = new Date();
    const existing = await prisma.deviceToken.findUnique({ where: { token } });

    if (existing) {
      await prisma.deviceToken.update({
        where: { token },
        data: {
          userId: user.id,
          platform: body.platform,
          active: true,
          lastSeen: now,
        },
      });
    } else {
      await prisma.deviceToken.create({
        data: {
          userId: user.id,
          platform: body.platform,
          token,
          active: true,
          lastSeen: now,
        },
      });
    }

    return reply.send({ ok: true });
  });

  fastify.post(
    '/notifications/test',
    { preHandler: [authenticate, requireRole('supervisor')] },
    async (request, reply) => {
      const bodySchema = z.object({
        title: z.string().min(1).optional(),
        body: z.string().min(1).optional(),
      });
      const body = bodySchema.parse(request.body ?? {});
      const title = body.title ?? 'EcoCombustible';
      const message = body.body ?? 'Notificación de prueba';

      try {
        await enqueueSupervisorNotification({
          title,
          body: message,
          data: { type: 'test' },
        });
        return reply.send({ ok: true });
      } catch (error) {
        request.log.error({ error }, 'Push notification failed');
        return reply.code(500).send({ error: 'Push notification failed' });
      }
    }
  );

  // ============================================
  // 🔥 AGREGAR ESTOS 2 ENDPOINTS:
  // ============================================

  /**
   * GET /notifications
   * Obtener todas las notificaciones del usuario
   */
  fastify.get(
    '/notifications',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const user = request.user as { id: number };

        const notifications = await prisma.notification.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 100,
        });

        return reply.send(notifications);
      } catch (error) {
        request.log.error(error);
        return reply
          .code(500)
          .send({ error: 'Error fetching notifications' });
      }
    }
  );

  /**
   * DELETE /notifications/:id
   * Eliminar una notificación
   */
  fastify.delete(
    '/notifications/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = request.user as { id: number };

        // Verificar que la notificación pertenece al usuario
        const notification = await prisma.notification.findUnique({
          where: { id: parseInt(id) },
        });

        if (!notification) {
          return reply.code(404).send({ error: 'Notification not found' });
        }

        if (notification.userId !== user.id) {
          return reply.code(403).send({ error: 'Unauthorized' });
        }

        await prisma.notification.delete({
          where: { id: parseInt(id) },
        });

        return reply.send({ success: true });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Error deleting notification' });
      }
    }
  );
};