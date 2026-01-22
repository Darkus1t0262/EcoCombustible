import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../lib/auth.js';
import { analyzeTransaction } from '../lib/analysis.js';
import { optionalDate, optionalNumber, optionalString } from '../lib/validation.js';
import { parsePagination } from '../lib/pagination.js';
import { evaluateTransactionRisk } from '../services/ml.js';

// Normaliza fechas y adjunta el analisis de riesgo.
const formatTransaction = (transaction: any, analysis: any) => ({
  ...transaction,
  occurredAt: transaction.occurredAt?.toISOString?.() ?? transaction.occurredAt,
  createdAt: transaction.createdAt?.toISOString?.() ?? transaction.createdAt,
  analysis,
});

export const registerTransactionRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/transactions', { preHandler: [authenticate] }, async (request, reply) => {
    // Paginacion opcional para optimizar respuestas grandes.
    const pagination = parsePagination((request as any).query);
    if (pagination) {
      const total = await prisma.transaction.count();
      reply.header('X-Total-Count', total);
      reply.header('X-Page', pagination.page);
      reply.header('X-Limit', pagination.limit);
    }

    const transactions = await prisma.transaction.findMany({
      include: { station: true, vehicle: true },
      orderBy: { occurredAt: 'desc' },
      ...(pagination ? { skip: pagination.offset, take: pagination.limit } : {}),
    });
    // Precalcula historial por vehiculo para analisis de consumos.
    const vehicleIds = Array.from(new Set(transactions.map((tx) => tx.vehicleId)));
    const historyByVehicle = new Map<number, number[]>();
    if (vehicleIds.length > 0) {
      const historyRows = await prisma.transaction.findMany({
        where: { vehicleId: { in: vehicleIds } },
        orderBy: { occurredAt: 'desc' },
        select: { vehicleId: true, liters: true },
      });
      for (const row of historyRows) {
        const list = historyByVehicle.get(row.vehicleId) ?? [];
        list.push(row.liters);
        historyByVehicle.set(row.vehicleId, list);
      }
    }
    return transactions.map((transaction) => {
      const history = historyByVehicle.get(transaction.vehicleId) ?? [];
      return formatTransaction(transaction, analyzeTransaction(transaction, history));
    });
  });

  fastify.get('/transactions/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
    const params = paramsSchema.parse(request.params);
    const transaction = await prisma.transaction.findUnique({
      where: { id: Number(params.id) },
      include: { station: true, vehicle: true },
    });
    if (!transaction) {
      return reply.code(404).send({ error: 'Not found' });
    }
    const history = await prisma.transaction.findMany({
      where: { vehicleId: transaction.vehicleId },
      orderBy: { occurredAt: 'desc' },
    });
    const litersHistory = history.map((item) => item.liters);
    return formatTransaction(transaction, analyzeTransaction(transaction, litersHistory));
  });

  fastify.post('/transactions', { preHandler: [authenticate] }, async (request, reply) => {
    // Valida payload y crea transaccion, incluyendo ML si esta habilitado.
    const payloadSchema = z.object({
      stationId: optionalNumber(),
      stationName: optionalString(),
      vehiclePlate: z.string().min(2),
      vehicleModel: optionalString(),
      capacityLiters: optionalNumber(),
      fuelType: optionalString(),
      ownerName: optionalString(),
      liters: z.coerce.number().positive(),
      unitPrice: z.coerce.number().positive(),
      paymentMethod: optionalString(),
      reportedBy: optionalString(),
      occurredAt: optionalDate(),
    });

    const payload = payloadSchema.parse(request.body);
    let stationId = payload.stationId ? Math.trunc(payload.stationId) : null;
    if (!stationId && payload.stationName) {
      const station = await prisma.station.findFirst({ where: { name: payload.stationName } });
      stationId = station?.id ?? null;
    }
    if (!stationId) {
      return reply.code(400).send({ error: 'Station not found.' });
    }

    let vehicle = await prisma.vehicle.findFirst({ where: { plate: payload.vehiclePlate } });
    if (!vehicle) {
      // Crea vehiculo si no existe y se proporcionan datos basicos.
      if (!payload.vehicleModel || !payload.capacityLiters || !payload.fuelType) {
        return reply.code(400).send({ error: 'Vehicle data required for new plate.' });
      }
      vehicle = await prisma.vehicle.create({
        data: {
          plate: payload.vehiclePlate,
          model: payload.vehicleModel,
          capacityLiters: payload.capacityLiters,
          fuelType: payload.fuelType,
          ownerName: payload.ownerName ?? null,
        },
      });
    }

    const occurredAt = payload.occurredAt ?? new Date();
    const totalAmount = Number((payload.liters * payload.unitPrice).toFixed(2));
    const mlRisk = await evaluateTransactionRisk({
      liters: payload.liters,
      unitPrice: payload.unitPrice,
      totalAmount,
      capacityLiters: vehicle.capacityLiters,
    });

    const transaction = await prisma.transaction.create({
      data: {
        stationId,
        vehicleId: vehicle.id,
        liters: payload.liters,
        unitPrice: payload.unitPrice,
        totalAmount,
        paymentMethod: payload.paymentMethod ?? null,
        reportedBy: payload.reportedBy ?? null,
        occurredAt,
        riskScore: mlRisk?.score ?? null,
        riskLabel: mlRisk?.label ?? null,
        mlVersion: mlRisk?.modelVersion ?? null,
      },
    });

    const history = await prisma.transaction.findMany({
      where: { vehicleId: vehicle.id },
      orderBy: { occurredAt: 'desc' },
    });
    const litersHistory = history.map((item) => item.liters);
    return reply
      .code(201)
      .send(formatTransaction({ ...transaction, vehicle }, analyzeTransaction({ ...transaction, vehicle }, litersHistory)));
  });
};
