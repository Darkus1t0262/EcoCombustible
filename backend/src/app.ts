import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { z } from 'zod';
import { parseOrigins, TRUST_PROXY, JWT_SECRET, JWT_EXPIRES_IN, JWT_ISSUER, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW, STORAGE_DRIVER } from './config/env.js';
import { ensureStorageDirs, STORAGE_DIR } from './config/storage.js';
import { registerHealthRoutes } from './modules/health.js';
import { registerAuthRoutes } from './modules/auth.js';
import { registerDashboardRoutes } from './modules/dashboard.js';
import { registerStationRoutes } from './modules/stations.js';
import { registerVehicleRoutes } from './modules/vehicles.js';
import { registerTransactionRoutes } from './modules/transactions.js';
import { registerAuditRoutes } from './modules/audits.js';
import { registerComplaintRoutes } from './modules/complaints.js';
import { registerReportRoutes } from './modules/reports.js';
import { registerFileRoutes } from './modules/files.js';
import { registerNotificationRoutes } from './modules/notifications.js';
import { registerUserRoutes } from './modules/users.js';
import { registerMetrics } from './observability/metrics.js';

export const buildApp = async () => {
  // Garantiza carpetas de almacenamiento antes de levantar el servidor.
  ensureStorageDirs();

  const fastify = Fastify({
    logger: {
      redact: ['req.headers.authorization'],
    },
    trustProxy: TRUST_PROXY,
  });

  // Adjunta un ID de request para trazabilidad en logs.
  fastify.addHook('onRequest', async (request, reply) => {
    reply.header('x-request-id', request.id);
  });

  // Seguridad, CORS y rate limiting deben registrarse antes de las rutas.
  await fastify.register(helmet, { global: true });
  await fastify.register(cors, { origin: parseOrigins() });
  await fastify.register(rateLimit, {
    global: true,
    max: RATE_LIMIT_MAX,
    timeWindow: RATE_LIMIT_WINDOW,
  });

  const jwtSignOptions: { expiresIn: string; issuer?: string } = {
    expiresIn: JWT_EXPIRES_IN,
  };
  if (JWT_ISSUER) {
    jwtSignOptions.issuer = JWT_ISSUER;
  }
  // JWT: configura emision/verificacion de tokens.
  await fastify.register(jwt, {
    secret: JWT_SECRET,
    sign: jwtSignOptions,
    verify: JWT_ISSUER ? { issuer: JWT_ISSUER } : undefined,
  });

  // Limita archivos subidos para evitar cargas muy grandes.
  await fastify.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  if (STORAGE_DRIVER === 'local') {
    // Solo expone archivos si el storage es local.
    await fastify.register(fastifyStatic, {
      root: STORAGE_DIR,
      prefix: '/files/',
      serve: false,
    });
  }

  await registerMetrics(fastify);

  await fastify.register(registerHealthRoutes);
  await fastify.register(registerAuthRoutes);
  await fastify.register(registerDashboardRoutes);
  await fastify.register(registerStationRoutes);
  await fastify.register(registerVehicleRoutes);
  await fastify.register(registerTransactionRoutes);
  await fastify.register(registerAuditRoutes);
  await fastify.register(registerComplaintRoutes);
  await fastify.register(registerReportRoutes);
  if (STORAGE_DRIVER === 'local') {
    await fastify.register(registerFileRoutes);
  }
  await fastify.register(registerNotificationRoutes);
  await fastify.register(registerUserRoutes);

  // Errores de validacion (Zod) retornan 400; otros errores 500.
  fastify.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    const statusCode = error instanceof z.ZodError ? 400 : 500;
    reply.code(statusCode).send({ error: 'Unexpected error' });
  });

  // Handler generico para rutas inexistentes.
  fastify.setNotFoundHandler((request, reply) => {
    reply.code(404).send({ error: 'Not found' });
  });

  return fastify;
};
