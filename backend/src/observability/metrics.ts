import { FastifyInstance } from 'fastify';
import { Counter, Histogram, collectDefaultMetrics, register } from 'prom-client';
import { METRICS_ENABLED, METRICS_PATH } from '../config/env.js';

const normalizePath = (value: string) => (value.startsWith('/') ? value : `/${value}`);

export const registerMetrics = async (fastify: FastifyInstance) => {
  if (!METRICS_ENABLED) {
    return;
  }

  collectDefaultMetrics();

  const httpRequests = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
  });

  const httpDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.05, 0.1, 0.2, 0.4, 0.8, 1.2, 2, 5],
  });

  fastify.addHook('onRequest', async (request) => {
    (request as any).startTime = process.hrtime.bigint();
  });

  fastify.addHook('onResponse', async (request, reply) => {
    const start = (request as any).startTime as bigint | undefined;
    const durationNs = start ? Number(process.hrtime.bigint() - start) : 0;
    const durationSec = durationNs / 1e9;
    const route = request.routeOptions?.url ?? 'unknown';
    const status = String(reply.statusCode);

    httpRequests.inc({ method: request.method, route, status });
    httpDuration.observe({ method: request.method, route, status }, durationSec);
  });

  const metricsPath = normalizePath(METRICS_PATH);
  fastify.get(metricsPath, async (_request, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
  });
};
