import 'dotenv/config';
import { Worker } from 'bullmq';
import { redisConnection } from './lib/queue.js';
import { notifySupervisors, notifyAdmin } from './services/notifications.js';
import { generateReport } from './services/reports.js';

const notificationsWorker = new Worker(
  'notifications',
  async (job) => {
    const { title, body, data } = job.data as { 
      title: string; 
      body: string; 
      data?: Record<string, unknown> 
    };

    // 🔥 DETERMINAR A QUIÉN ENVIAR LA NOTIFICACIÓN
    if (job.name === 'notify-supervisors') {
      console.log('[Worker] 📢 Procesando: notificar supervisores');
      await notifySupervisors({ title, body, data });
    } else if (job.name === 'notify-admin') {
      console.log('[Worker] 📢 Procesando: notificar admin');
      await notifyAdmin({ title, body, data });
    } else {
      // Por compatibilidad, si no tiene name específico, notifica supervisores
      console.log('[Worker] 📢 Procesando: notificación genérica');
      await notifySupervisors({ title, body, data });
    }
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

// ============================================
// EVENT HANDLERS - NOTIFICACIONES
// ============================================
notificationsWorker.on('completed', (job) => {
  console.log(`[Worker] ✅ Notificación completada: ${job?.id}`);
});

notificationsWorker.on('failed', (job, error) => {
  console.error(`[Worker] ❌ Notificación falló (job ${job?.id}):`, error);
});

notificationsWorker.on('error', (error) => {
  console.error('[Worker] ❌ Error en notifications worker:', error);
});

// ============================================
// EVENT HANDLERS - REPORTES
// ============================================
reportsWorker.on('completed', (job) => {
  console.log(`[Worker] ✅ Reporte completado: ${job?.id}`);
});

reportsWorker.on('failed', (job, error) => {
  console.error(`[Worker] ❌ Reporte falló (job ${job?.id}):`, error);
});

reportsWorker.on('error', (error) => {
  console.error('[Worker] ❌ Error en reports worker:', error);
});

console.log('[Worker] 🚀 Workers iniciados (notifications + reports)');