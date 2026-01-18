import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { enqueueReportGeneration } from '../services/reports.js';
import { parsePagination } from '../lib/pagination.js';

export const registerReportRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/reports', { preHandler: [authenticate] }, async (request, reply) => {
    const pagination = parsePagination((request as any).query);
    if (pagination) {
      const total = await prisma.report.count();
      reply.header('X-Total-Count', total);
      reply.header('X-Page', pagination.page);
      reply.header('X-Limit', pagination.limit);
    }
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      ...(pagination ? { skip: pagination.offset, take: pagination.limit } : {}),
    });
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
        period: z.enum(['Semana', 'Mes', 'Año', 'Anio']),
        format: z.enum(['PDF', 'Excel', 'CSV']),
      });
      const body = bodySchema.parse(request.body);
      const period = body.period === 'Anio' ? 'Año' : body.period;

      const createdAt = new Date();
      let responseReport = await prisma.report.create({
        data: {
          period,
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
