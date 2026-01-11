import IORedis from 'ioredis';
import { Queue } from 'bullmq';
import { REDIS_URL } from '../config/env.js';

export const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const notificationQueue = new Queue('notifications', {
  connection: redisConnection,
});

export const reportQueue = new Queue('reports', {
  connection: redisConnection,
});
