import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../lib/auth.js';

export const registerFileRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/files/:category/:filename', { preHandler: [authenticate] }, async (request, reply) => {
    const paramsSchema = z.object({
      category: z.enum(['reports', 'complaints']),
      filename: z.string().min(1),
    });
    const params = paramsSchema.parse(request.params);
    if (!/^[a-zA-Z0-9._-]+$/.test(params.filename)) {
      return reply.code(400).send({ error: 'Invalid filename' });
    }
    return reply.sendFile(`${params.category}/${params.filename}`);
  });
};
