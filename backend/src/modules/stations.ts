import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../lib/auth.js';
import { analyzeStation } from '../lib/analysis.js';
import { parsePagination } from '../lib/pagination.js';

export const registerStationRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/stations', { preHandler: [authenticate] }, async (request, reply) => {
    // Soporta paginacion opcional via query params.
    const pagination = parsePagination((request as any).query);
    if (pagination) {
      const total = await prisma.station.count();
      reply.header('X-Total-Count', total);
      reply.header('X-Page', pagination.page);
      reply.header('X-Limit', pagination.limit);
    }

    const stations = await prisma.station.findMany({
      orderBy: { name: 'asc' },
      ...(pagination ? { skip: pagination.offset, take: pagination.limit } : {}),
    });
    // Incluye analisis derivado para cada estacion.
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
    // Responde con analisis y normaliza historial.
    return { ...station, history: station.history ?? [], analysis: analyzeStation(station) };
  });
};
