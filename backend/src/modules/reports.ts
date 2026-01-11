import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { enqueueReportGeneration } from '../services/reports.js';

export const registerReportRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/reports', { preHandler: [authenticate] }, async () => {
    const reports = await prisma.report.findMany({ orderBy: { createdAt: 'desc' } });
    return reports.map((report) => ({
      ...report,
      createdAt: report.createdAt.toISOString(),
    }));
  });

  fastify.post(
    '/reports',
    { preHandler: [authenticate, requireRole('supervisor')] },
    async (request, reply) => {
      const bodySchema = z.object({
        period: z.enum(['Semana', 'Mes', 'Anio']),
        format: z.enum(['PDF', 'Excel', 'CSV']),
      });
      const body = bodySchema.parse(request.body);

      const createdAt = new Date();
      let responseReport = await prisma.report.create({
        data: {
          period: body.period,
          format: body.format,
          createdAt,
          sizeMb: 0,
          fileUrl: null,
          mimeType: null,
          status: 'queued',
          error: null,
        },
      });

      try {
        await enqueueReportGeneration(responseReport.id);
      } catch (error) {
        const message = (error as Error).message;
        responseReport = await prisma.report.update({
          where: { id: responseReport.id },
          data: { status: 'failed', error: message },
        });
      }

      return reply.code(201).send({
        ...responseReport,
        createdAt: responseReport.createdAt.toISOString(),
      });
    }
  );
};
