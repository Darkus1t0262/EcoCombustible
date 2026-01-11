import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../lib/auth.js';
import { analyzeTransaction } from '../lib/analysis.js';
import { parsePagination } from '../lib/pagination.js';

const formatTransaction = (transaction: any, analysis: any) => ({
  ...transaction,
  occurredAt: transaction.occurredAt?.toISOString?.() ?? transaction.occurredAt,
  createdAt: transaction.createdAt?.toISOString?.() ?? transaction.createdAt,
  analysis,
});

export const registerVehicleRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/vehicles', { preHandler: [authenticate] }, async (request, reply) => {
    const pagination = parsePagination((request as any).query);
    if (pagination) {
      const total = await prisma.vehicle.count();
      reply.header('X-Total-Count', total);
      reply.header('X-Page', pagination.page);
      reply.header('X-Limit', pagination.limit);
    }

    const vehicles = await prisma.vehicle.findMany({
      orderBy: { plate: 'asc' },
      ...(pagination ? { skip: pagination.offset, take: pagination.limit } : {}),
    });
    return vehicles.map((vehicle) => ({
      ...vehicle,
      createdAt: vehicle.createdAt.toISOString(),
    }));
  });

  fastify.get('/vehicles/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
    const params = paramsSchema.parse(request.params);
    const vehicle = await prisma.vehicle.findUnique({ where: { id: Number(params.id) } });
    if (!vehicle) {
      return reply.code(404).send({ error: 'Not found' });
    }
    return { ...vehicle, createdAt: vehicle.createdAt.toISOString() };
  });

  fastify.get('/vehicles/:id/transactions', { preHandler: [authenticate] }, async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
    const params = paramsSchema.parse(request.params);
    const vehicleId = Number(params.id);
    const pagination = parsePagination((request as any).query);
    if (pagination) {
      const total = await prisma.transaction.count({ where: { vehicleId } });
      reply.header('X-Total-Count', total);
      reply.header('X-Page', pagination.page);
      reply.header('X-Limit', pagination.limit);
    }
    const transactions = await prisma.transaction.findMany({
      where: { vehicleId },
      include: { station: true, vehicle: true },
      orderBy: { occurredAt: 'desc' },
      ...(pagination ? { skip: pagination.offset, take: pagination.limit } : {}),
    });
    const historySource = pagination
      ? await prisma.transaction.findMany({
          where: { vehicleId },
          orderBy: { occurredAt: 'desc' },
          select: { liters: true },
        })
      : transactions;
    const history = historySource.map((t) => t.liters);
    return transactions.map((transaction) =>
      formatTransaction(transaction, analyzeTransaction(transaction, history))
    );
  });
};
