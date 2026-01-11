import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { optionalDate, optionalNumber, optionalString } from '../lib/validation.js';
import { COMPLAINTS_DIR, safeFilename } from '../config/storage.js';
import { FILES_BASE_URL } from '../config/env.js';
import { enqueueSupervisorNotification } from '../services/notifications.js';
import { parsePagination } from '../lib/pagination.js';

const formatComplaint = (complaint: any) => ({
  ...complaint,
  createdAt: complaint.createdAt?.toISOString?.() ?? complaint.createdAt,
  occurredAt: complaint.occurredAt ? complaint.occurredAt.toISOString() : null,
  resolvedAt: complaint.resolvedAt ? complaint.resolvedAt.toISOString() : null,
});

export const registerComplaintRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/complaints', { preHandler: [authenticate] }, async (request, reply) => {
    const pagination = parsePagination((request as any).query);
    if (pagination) {
      const total = await prisma.complaint.count();
      reply.header('X-Total-Count', total);
      reply.header('X-Page', pagination.page);
      reply.header('X-Limit', pagination.limit);
    }
    const complaints = await prisma.complaint.findMany({
      orderBy: { createdAt: 'desc' },
      ...(pagination ? { skip: pagination.offset, take: pagination.limit } : {}),
    });
    return complaints.map(formatComplaint);
  });

  fastify.get('/complaints/stats', { preHandler: [authenticate] }, async () => {
    const total = await prisma.complaint.count();
    const pending = await prisma.complaint.count({ where: { status: 'pending' } });
    const resolved = await prisma.complaint.count({ where: { status: 'resolved' } });
    return { total, pending, resolved };
  });

  fastify.post('/complaints', { preHandler: [authenticate] }, async (request, reply) => {
    const payloadSchema = z.object({
      stationName: z.string().min(2),
      stationId: optionalNumber(),
      type: z.string().min(2),
      detail: optionalString(),
      source: optionalString(),
      reporterName: optionalString(),
      reporterRole: optionalString(),
      vehiclePlate: optionalString(),
      vehicleModel: optionalString(),
      fuelType: optionalString(),
      vehicleId: optionalNumber(),
      liters: optionalNumber(),
      unitPrice: optionalNumber(),
      totalAmount: optionalNumber(),
      occurredAt: optionalDate(),
      transactionId: optionalNumber(),
    });

    let payload: z.infer<typeof payloadSchema>;
    let photoUrl: string | null = null;

    if ((request as any).isMultipart?.()) {
      const fields: Record<string, string> = {};
      for await (const part of (request as any).parts()) {
        if (part.type === 'file') {
          if (part.mimetype && !part.mimetype.startsWith('image/')) {
            return reply.code(400).send({ error: 'Invalid file type' });
          }
          const fileName = safeFilename(part.filename ?? `photo_${Date.now()}.jpg`);
          const storedName = `${Date.now()}_${fileName}`;
          const destPath = path.join(COMPLAINTS_DIR, storedName);
          await pipeline(part.file, createWriteStream(destPath));
          photoUrl = `${FILES_BASE_URL}/files/complaints/${storedName}`;
        } else {
          fields[part.fieldname] = String(part.value ?? '');
        }
      }
      payload = payloadSchema.parse(fields);
    } else {
      payload = payloadSchema.parse(request.body);
    }

    const complaint = await prisma.complaint.create({
      data: {
        stationName: payload.stationName,
        stationId: payload.stationId === undefined ? null : Math.trunc(payload.stationId),
        type: payload.type,
        detail: payload.detail ?? null,
        source: payload.source ?? null,
        reporterName: payload.reporterName ?? null,
        reporterRole: payload.reporterRole ?? null,
        vehiclePlate: payload.vehiclePlate ?? null,
        vehicleModel: payload.vehicleModel ?? null,
        fuelType: payload.fuelType ?? null,
        vehicleId: payload.vehicleId === undefined ? null : Math.trunc(payload.vehicleId),
        liters: payload.liters ?? null,
        unitPrice: payload.unitPrice ?? null,
        totalAmount: payload.totalAmount ?? null,
        occurredAt: payload.occurredAt ?? null,
        transactionId: payload.transactionId === undefined ? null : Math.trunc(payload.transactionId),
        photoUrl,
        status: 'pending',
      },
    });

    void enqueueSupervisorNotification({
      title: 'Nueva denuncia',
      body: `${payload.stationName}: ${payload.type}`,
      data: {
        complaintId: complaint.id,
        stationName: payload.stationName,
        type: payload.type,
      },
    }).catch((error) => {
      request.log.error({ error }, 'Push notification enqueue failed');
    });

    return reply.code(201).send(formatComplaint(complaint));
  });

  fastify.get('/complaints/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
    const params = paramsSchema.parse(request.params);
    const complaint = await prisma.complaint.findUnique({ where: { id: Number(params.id) } });
    if (!complaint) {
      return reply.code(404).send({ error: 'Not found' });
    }
    return formatComplaint(complaint);
  });

  fastify.patch(
    '/complaints/:id',
    { preHandler: [authenticate, requireRole('supervisor')] },
    async (request, reply) => {
      const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
      const bodySchema = z.object({
        status: z.enum(['pending', 'resolved']).optional(),
        resolutionNote: optionalString(),
      });
      const params = paramsSchema.parse(request.params);
      const body = bodySchema.parse(request.body);

      if (!body.status && !body.resolutionNote) {
        return reply.code(400).send({ error: 'No changes provided' });
      }

      const update: {
        status?: string;
        resolutionNote?: string | null;
        resolvedAt?: Date | null;
      } = {};

      if (body.status) {
        update.status = body.status;
        update.resolvedAt = body.status === 'resolved' ? new Date() : null;
      }
      if (body.resolutionNote !== undefined) {
        update.resolutionNote = body.resolutionNote ?? null;
      }

      const updated = await prisma.complaint.update({
        where: { id: Number(params.id) },
        data: update,
      });

      return formatComplaint(updated);
    }
  );
};
