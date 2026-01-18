import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { parsePagination } from '../lib/pagination.js';

const toUserResponse = (user: any) => ({
  id: user.id,
  username: user.username,
  name: user.name,
  role: user.role,
  active: user.active,
  createdAt: user.createdAt?.toISOString?.() ?? user.createdAt,
  updatedAt: user.updatedAt?.toISOString?.() ?? user.updatedAt,
  lastLoginAt: user.lastLoginAt?.toISOString?.() ?? user.lastLoginAt ?? null,
});

export const registerUserRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/users', { preHandler: [authenticate, requireRole('admin')] }, async (request, reply) => {
    const pagination = parsePagination((request as any).query);
    if (pagination) {
      const total = await prisma.user.count();
      reply.header('X-Total-Count', total);
      reply.header('X-Page', pagination.page);
      reply.header('X-Limit', pagination.limit);
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      ...(pagination ? { skip: pagination.offset, take: pagination.limit } : {}),
    });
    return users.map(toUserResponse);
  });

  fastify.get('/users/:id', { preHandler: [authenticate, requireRole('admin')] }, async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
    const params = paramsSchema.parse(request.params);
    const user = await prisma.user.findUnique({ where: { id: Number(params.id) } });
    if (!user) {
      return reply.code(404).send({ error: 'Not found' });
    }
    return toUserResponse(user);
  });

  fastify.post('/users', { preHandler: [authenticate, requireRole('admin')] }, async (request, reply) => {
    const bodySchema = z.object({
      username: z.string().min(3),
      password: z.string().min(6),
      name: z.string().min(1),
      role: z.string().min(2),
      active: z.boolean().optional(),
    });
    const body = bodySchema.parse(request.body);
    const exists = await prisma.user.findUnique({ where: { username: body.username } });
    if (exists) {
      return reply.code(409).send({ error: 'Username already exists' });
    }
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        username: body.username,
        passwordHash,
        name: body.name,
        role: body.role,
        active: body.active ?? true,
      },
    });
    return reply.code(201).send(toUserResponse(user));
  });

  fastify.patch('/users/:id', { preHandler: [authenticate, requireRole('admin')] }, async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
    const bodySchema = z
      .object({
        name: z.string().min(1).optional(),
        role: z.string().min(2).optional(),
        active: z.boolean().optional(),
      })
      .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });

    const params = paramsSchema.parse(request.params);
    const body = bodySchema.parse(request.body);
    const userId = Number(params.id);
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return reply.code(404).send({ error: 'Not found' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.role ? { role: body.role } : {}),
        ...(typeof body.active === 'boolean' ? { active: body.active } : {}),
      },
    });
    return toUserResponse(user);
  });

  fastify.patch(
    '/users/:id/password',
    { preHandler: [authenticate, requireRole('admin')] },
    async (request, reply) => {
      const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
      const bodySchema = z.object({ password: z.string().min(6) });
      const params = paramsSchema.parse(request.params);
      const body = bodySchema.parse(request.body);
      const userId = Number(params.id);
      const existing = await prisma.user.findUnique({ where: { id: userId } });
      if (!existing) {
        return reply.code(404).send({ error: 'Not found' });
      }

      const passwordHash = await bcrypt.hash(body.password, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });
      return reply.send({ ok: true });
    }
  );
};
