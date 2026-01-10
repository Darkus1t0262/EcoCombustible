import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../lib/auth.js';
import { analyzeTransaction } from '../lib/analysis.js';

const formatTransaction = (transaction: any, analysis: any) => ({
  ...transaction,
  occurredAt: transaction.occurredAt?.toISOString?.() ?? transaction.occurredAt,
  createdAt: transaction.createdAt?.toISOString?.() ?? transaction.createdAt,
  analysis,
});

export const registerVehicleRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/vehicles', { preHandler: [authenticate] }, async () => {
    const vehicles = await prisma.vehicle.findMany({ orderBy: { plate: 'asc' } });
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

  fastify.get('/vehicles/:id/transactions', { preHandler: [authenticate] }, async (request) => {
    const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
    const params = paramsSchema.parse(request.params);
    const vehicleId = Number(params.id);
    const transactions = await prisma.transaction.findMany({
      where: { vehicleId },
      include: { station: true, vehicle: true },
      orderBy: { occurredAt: 'desc' },
    });
    const history = transactions.map((t) => t.liters);
    return transactions.map((transaction) =>
      formatTransaction(transaction, analyzeTransaction(transaction, history))
    );
  });
};
