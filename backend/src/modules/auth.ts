import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../lib/auth.js';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export const registerAuthRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    '/auth/login',
    {
      config: {
        rateLimit: { max: 10, timeWindow: '1 minute' },
      },
    },
    async (request, reply) => {
      const bodySchema = z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      });
      const body = bodySchema.parse(request.body);
      const user = await prisma.user.findUnique({ where: { username: body.username } });

      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      if (!user.active) {
        return reply.code(403).send({ error: 'Account disabled' });
      }

      const now = new Date();
      if (user.lockedUntil && user.lockedUntil > now) {
        return reply.code(429).send({ error: 'Account locked. Try again later.' });
      }

      const valid = await bcrypt.compare(body.password, user.passwordHash);
      if (!valid) {
        const nextAttempts = user.failedLoginAttempts + 1;
        if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000),
            },
          });
        } else {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: nextAttempts },
          });
        }
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: now,
        },
      });

      const token = fastify.jwt.sign(
        { id: user.id, username: user.username, name: user.name, role: user.role, active: user.active },
        { expiresIn: '1d' }
      );

      return reply.send({
        user: { id: user.id, username: user.username, name: user.name, role: user.role, active: user.active },
        token,
      });
    }
  );

  fastify.post('/auth/change-password', { preHandler: [authenticate] }, async (request, reply) => {
    const bodySchema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6),
    });
    const body = bodySchema.parse(request.body);
    const userId = (request.user as { id?: number } | undefined)?.id;
    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!valid) {
      return reply.code(400).send({ error: 'Invalid password' });
    }

    const nextHash = await bcrypt.hash(body.newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: nextHash },
    });

    return reply.send({ ok: true });
  });
};
