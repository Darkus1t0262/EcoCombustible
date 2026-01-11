import 'dotenv/config';
import { Worker } from 'bullmq';
import { redisConnection } from './lib/queue.js';
import { notifySupervisors } from './services/notifications.js';
import { generateReport } from './services/reports.js';

const notificationsWorker = new Worker(
  'notifications',
  async (job) => {
    const { title, body, data } = job.data as { title: string; body: string; data?: Record<string, unknown> };
    await notifySupervisors({ title, body, data });
  },
  { connection: redisConnection }
);

const reportsWorker = new Worker(
  'reports',
  async (job) => {
    const { reportId } = job.data as { reportId: number };
    await generateReport(reportId);
  },
  { connection: redisConnection }
);

notificationsWorker.on('failed', (job, error) => {
  console.error('Notification job failed', job?.id, error);
});

reportsWorker.on('failed', (job, error) => {
  console.error('Report job failed', job?.id, error);
});

console.log('Worker running');
