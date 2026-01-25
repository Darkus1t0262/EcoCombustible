import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { parsePagination } from '../lib/pagination.js';
import { optionalNumber, optionalString } from '../lib/validation.js';

export const registerAuditRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/audits', { preHandler: [authenticate] }, async (request, reply) => {
    const querySchema = z.object({
      status: z.enum(['pending', 'approved', 'rejected']).optional(),
      stationId: optionalNumber(),
      q: optionalString(),
    });
    const queryResult = querySchema.safeParse(request.query);
    if (!queryResult.success) {
      return reply.code(400).send({ error: 'Invalid query' });
    }
    const query = queryResult.data;
    const normalizedQuery = query.q?.trim();
    const where: Record<string, any> = {};
    if (query.status) {
      where.status = query.status;
    }
    if (typeof query.stationId === 'number') {
      where.stationId = Math.trunc(query.stationId);
    }
    if (normalizedQuery) {
      where.OR = [
        { code: { contains: normalizedQuery, mode: 'insensitive' } },
        { station: { name: { contains: normalizedQuery, mode: 'insensitive' } } },
      ];
    }
    const pagination = parsePagination((request as any).query);
    if (pagination) {
      const total = await prisma.audit.count({ where });
      reply.header('X-Total-Count', total);
      reply.header('X-Page', pagination.page);
      reply.header('X-Limit', pagination.limit);
    }
    const audits = await prisma.audit.findMany({
      where,
      include: { station: true },
      orderBy: { createdAt: 'desc' },
      ...(pagination ? { skip: pagination.offset, take: pagination.limit } : {}),
    });
    return audits.map((audit) => ({
      id: audit.id,
      stationId: audit.stationId,
      stationName: audit.station.name,
      code: audit.code,
      status: audit.status,
      priceExpected: audit.priceExpected,
      priceReported: audit.priceReported,
      dispenserOk: audit.dispenserOk,
      createdAt: audit.createdAt.toISOString(),
    }));
  });

  fastify.patch(
    '/audits/:id',
    { preHandler: [authenticate, requireRole('supervisor')] },
    async (request, reply) => {
      const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
      const bodySchema = z.object({ status: z.enum(['approved', 'rejected']) });
      const params = paramsSchema.parse(request.params);
      const body = bodySchema.parse(request.body);

      const audit = await prisma.audit.update({
        where: { id: Number(params.id) },
        data: { status: body.status },
      });

      if (body.status === 'approved') {
        await prisma.station.update({
          where: { id: audit.stationId },
          data: { lastAudit: new Date() },
        });
      }

      return { ok: true };
    }
  );
};
