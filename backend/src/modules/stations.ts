import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { analyzeStation } from '../lib/analysis.js';
import { parsePagination } from '../lib/pagination.js';

export const registerStationRoutes = async (fastify: FastifyInstance) => {

  // =========================
  // GET /stations (LISTAR) Ya funcionaba antes
  // =========================
  fastify.get(
    '/stations',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const pagination = parsePagination((request as any).query);

      if (pagination) {
        const total = await prisma.station.count();
        reply.header('X-Total-Count', total);
        reply.header('X-Page', pagination.page);
        reply.header('X-Limit', pagination.limit);
      }

      const stations = await prisma.station.findMany({
        orderBy: { name: 'asc' },
        ...(pagination
          ? { skip: pagination.offset, take: pagination.limit }
          : {}),
      });

      return stations.map((station) => ({
        ...station,
        history: station.history ?? [],
        analysis: analyzeStation(station),
      }));
    }
  );

  // =========================
  // GET /stations/:id (DETALLE) ya Funciona
  // =========================
  fastify.get(
    '/stations/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const paramsSchema = z.object({
        id: z.string().regex(/^\d+$/),
      });

      const { id } = paramsSchema.parse(request.params);

      const station = await prisma.station.findUnique({
        where: { id: Number(id) },
      });

      if (!station) {
        return reply.code(404).send({ error: 'Station not found' });
      }

      return {
        ...station,
        history: station.history ?? [],
        analysis: analyzeStation(station),
      };
    }
  );

  // =========================
  // POST /stations (CREAR) Funciona de Manera Correcta
  // =========================
  fastify.post(
    '/stations',
    { preHandler: [authenticate, requireRole('admin')] },
    async (request, reply) => {
      const bodySchema = z.object({
        name: z.string().min(3),
        address: z.string().min(5),
        lat: z.number(),
        lng: z.number(),
        stock: z.number().int().nonnegative(),
        price: z.number().positive(),
        officialPrice: z.number().positive(),
      });

      const data = bodySchema.parse(request.body);

      const station = await prisma.station.create({
        data: {
          ...data,
          history: [],
          status: 'Cumplimiento',
        },
      });

      return reply.code(201).send({
        ...station,
        history: station.history ?? [],
        analysis: analyzeStation(station),
      });
    }
  );

  // =========================
  // PUT /stations/:id (EDITAR) Ya funciona , solo era problema con el Docker
  // =========================
  fastify.put(
    '/stations/:id',
    { preHandler: [authenticate, requireRole('admin')] },
    async (request, reply) => {
      const paramsSchema = z.object({
        id: z.string().regex(/^\d+$/),
      });

      const bodySchema = z.object({
        name: z.string().min(3).optional(),
        address: z.string().min(5).optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        stock: z.number().int().nonnegative().optional(),
        price: z.number().positive().optional(),
        officialPrice: z.number().positive().optional(),
      });

      const { id } = paramsSchema.parse(request.params);
      const data = bodySchema.parse(request.body);

      const station = await prisma.station.update({
        where: { id: Number(id) },
        data,
      });

      return {
        ...station,
        history: station.history ?? [],
        analysis: analyzeStation(station),
      };
    }
  );

  // =========================
  // DELETE /stations/:id (ELIMINAR) Ya Funciona
  // =========================
  fastify.delete(
    '/stations/:id',
    { preHandler: [authenticate, requireRole('admin')] },
    async (request, reply) => {
      const paramsSchema = z.object({
        id: z.string().regex(/^\d+$/),
      });

      const { id } = paramsSchema.parse(request.params);

      await prisma.station.delete({
        where: { id: Number(id) },
      });

      return reply.code(204).send();
    }
  );
};
