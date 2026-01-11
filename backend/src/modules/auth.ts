import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

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
        { id: user.id, username: user.username, name: user.name, role: user.role },
        { expiresIn: '1d' }
      );

      return reply.send({
        user: { id: user.id, username: user.username, name: user.name, role: user.role },
        token,
      });
    }
  );
};
