import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { parsePagination } from '../lib/pagination.js';
import {
  enqueueSupervisorNotification,
  enqueueAdminNotification,
} from '../services/notifications.js';

export const registerAuditRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/audits', { preHandler: [authenticate] }, async (request, reply) => {
    const pagination = parsePagination((request as any).query);
    if (pagination) {
      const total = await prisma.audit.count();
      reply.header('X-Total-Count', total);
      reply.header('X-Page', pagination.page);
      reply.header('X-Limit', pagination.limit);
    }
    const audits = await prisma.audit.findMany({
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

  // ============================================
  // PATCH /audits/:id - SUPERVISOR APRUEBA/RECHAZA
  // ============================================
  fastify.patch(
    '/audits/:id',
    { preHandler: [authenticate, requireRole('supervisor')] },
    async (request, reply) => {
      const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
      const bodySchema = z.object({ status: z.enum(['approved', 'rejected']) });
      const params = paramsSchema.parse(request.params);
      const body = bodySchema.parse(request.body);

      // 🔥 OBTENER AUDITORÍA ACTUAL PARA VALIDAR
      const auditBefore = await prisma.audit.findUnique({
        where: { id: Number(params.id) },
        include: { station: true },
      });

      if (!auditBefore) {
        return reply.code(404).send({ error: 'Audit not found' });
      }

      // ✅ VALIDAR: Solo auditorías "pending" pueden cambiar
      if (auditBefore.status !== 'pending') {
        return reply.code(400).send({
          error: `Cannot change audit status. Current status is "${auditBefore.status}", only "pending" audits can be modified.`,
        });
      }

      // Actualizar auditoría
      const audit = await prisma.audit.update({
        where: { id: Number(params.id) },
        data: { status: body.status },
        include: { station: true },
      });

      if (body.status === 'approved') {
        await prisma.station.update({
          where: { id: audit.stationId },
          data: { lastAudit: new Date() },
        });
      }

      // 🔔 SUPERVISOR CAMBIÓ STATUS → NOTIFICAR AL ADMIN
      const supervisorUser = request.user as { id: number; username: string };
      void enqueueAdminNotification({
        title: `📋 Auditoría ${
          body.status === 'approved' ? '✅ Aprobada' : '❌ Rechazada'
        } por ${supervisorUser.username}`,
        body: `${audit.code} - ${audit.station.name}`,
        data: {
          auditId: audit.id,
          newStatus: body.status,
          stationId: audit.stationId,
          stationName: audit.station.name,
          supervisorId: supervisorUser.id,
          supervisorUsername: supervisorUser.username,
          priceExpected: audit.priceExpected,
          priceReported: audit.priceReported,

          type: 'audit_status_changed_by_supervisor',
        },
      }).catch((error) => {
        request.log.error(error);
      });

      return { ok: true };
    }
  );

  // ============================================
  // PATCH /audits/:id/admin-review - ADMIN APRUEBA/RECHAZA
  // ============================================
  fastify.patch(
    '/audits/:id/admin-review',
    { preHandler: [authenticate, requireRole('admin')] },
    async (request, reply) => {
      const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
      const bodySchema = z.object({ status: z.enum(['approved', 'rejected']) });
      const params = paramsSchema.parse(request.params);
      const body = bodySchema.parse(request.body);

      // 🔥 OBTENER AUDITORÍA ACTUAL PARA VALIDAR
      const auditBefore = await prisma.audit.findUnique({
        where: { id: Number(params.id) },
        include: { station: true },
      });

      if (!auditBefore) {
        return reply.code(404).send({ error: 'Audit not found' });
      }

      // ✅ VALIDAR: Solo auditorías "pending" pueden cambiar
      if (auditBefore.status !== 'pending') {
        return reply.code(400).send({
          error: `Cannot change audit status. Current status is "${auditBefore.status}", only "pending" audits can be modified.`,
        });
      }

      // Actualizar auditoría
      const audit = await prisma.audit.update({
        where: { id: Number(params.id) },
        data: { status: body.status },
        include: { station: true },
      });

      if (body.status === 'approved') {
        await prisma.station.update({
          where: { id: audit.stationId },
          data: { lastAudit: new Date() },
        });
      }

      // 🔔 ADMIN CAMBIÓ STATUS → NOTIFICAR A SUPERVISORES
      const adminUser = request.user as { id: number; username: string };
      void enqueueSupervisorNotification({
        title: `✅ Auditoría ${
          body.status === 'approved' ? 'Aprobada' : 'Rechazada'
        } por admin`,
        body: `${audit.code} - ${audit.station.name}`,
        data: {
          auditId: audit.id,
          newStatus: body.status,
          stationId: audit.stationId,
          stationName: audit.station.name,
          adminId: adminUser.id,
          adminUsername: adminUser.username,
          type: 'audit_status_changed_by_admin',
        },
      }).catch((error) => {
        request.log.error(error);
      });

      return { ok: true };
    }
  );
};