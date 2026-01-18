import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { isValidExpoPushToken } from '../push.js';
import { enqueueSupervisorNotification } from '../services/notifications.js';

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
};
