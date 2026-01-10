import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole } from '../lib/auth.js';

export const registerAuditRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/audits', { preHandler: [authenticate] }, async () => {
    const audits = await prisma.audit.findMany({
      include: { station: true },
      orderBy: { createdAt: 'desc' },
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
