import { FastifyInstance } from 'fastify';
import { APP_NAME, APP_STAGE, APP_VERSION, NODE_ENV } from '../config/env.js';

export const registerHealthRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/health', async () => ({
    status: 'ok',
    app: APP_NAME,
    version: APP_VERSION,
    stage: APP_STAGE,
    env: NODE_ENV,
    timestamp: new Date().toISOString(),
    uptimeSec: Math.round(process.uptime()),
  }));
};
