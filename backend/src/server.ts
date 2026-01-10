import 'dotenv/config';
import { buildApp } from './app.js';
import { HOST, PORT } from './config/env.js';

const fastify = await buildApp();

try {
  await fastify.listen({ port: PORT, host: HOST });
} catch (error) {
  fastify.log.error(error);
  process.exit(1);
}
