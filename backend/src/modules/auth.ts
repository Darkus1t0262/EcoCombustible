import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

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

      const valid = await bcrypt.compare(body.password, user.passwordHash);
      if (!valid) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

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
