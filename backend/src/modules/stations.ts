import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../lib/auth.js';
import { analyzeStation } from '../lib/analysis.js';

export const registerStationRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/stations', { preHandler: [authenticate] }, async () => {
    const stations = await prisma.station.findMany({ orderBy: { name: 'asc' } });
    return stations.map((station) => ({
      ...station,
      history: station.history ?? [],
      analysis: analyzeStation(station),
    }));
  });

  fastify.get('/stations/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
    const params = paramsSchema.parse(request.params);
    const station = await prisma.station.findUnique({ where: { id: Number(params.id) } });
    if (!station) {
      return reply.code(404).send({ error: 'Not found' });
    }
    return { ...station, history: station.history ?? [], analysis: analyzeStation(station) };
  });
};
