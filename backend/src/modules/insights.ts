import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../lib/auth.js';

type InsightItem = {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  action?: {
    label: string;
    route: string;
  };
};

const addItem = (items: InsightItem[], item: InsightItem) => {
  items.push(item);
};

export const registerInsightRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/insights', { preHandler: [authenticate] }, async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const [
      pendingComplaints,
      pendingAudits,
      highRiskTransactions,
      reportsToday,
    ] = await Promise.all([
      prisma.complaint.count({ where: { status: 'pending' } }),
      prisma.audit.count({ where: { status: 'pending' } }),
      prisma.transaction.count({ where: { riskLabel: 'high', occurredAt: { gte: weekStart } } }),
      prisma.report.count({ where: { createdAt: { gte: todayStart } } }),
    ]);

    const items: InsightItem[] = [];

    if (pendingComplaints > 0) {
      addItem(items, {
        id: 'complaints-pending',
        title: 'Denuncias por revisar',
        message: `Hay ${pendingComplaints} denuncias pendientes. ¿Quieres verlas ahora?`,
        severity: pendingComplaints >= 6 ? 'critical' : 'warning',
        action: { label: 'Ver denuncias', route: 'Complaints' },
      });
    }

    if (pendingAudits > 0) {
      addItem(items, {
        id: 'audits-pending',
        title: 'Auditorías en seguimiento',
        message: `Tienes ${pendingAudits} auditorías pendientes de cierre.`,
        severity: pendingAudits >= 5 ? 'critical' : 'warning',
        action: { label: 'Ver auditorías', route: 'Audit' },
      });
    }

    if (highRiskTransactions > 0) {
      addItem(items, {
        id: 'transactions-high-risk',
        title: 'Transacciones con riesgo alto',
        message: `${highRiskTransactions} transacciones de alto riesgo en los últimos 7 días.`,
        severity: 'critical',
        action: { label: 'Ver transacciones', route: 'TransactionList' },
      });
    }

    if (reportsToday === 0) {
      addItem(items, {
        id: 'reports-missing',
        title: 'Reporte diario pendiente',
        message: 'Aún no se generó el reporte de hoy.',
        severity: 'info',
        action: { label: 'Ir a reportes', route: 'Reports' },
      });
    }

    if (items.length === 0) {
      addItem(items, {
        id: 'all-clear',
        title: 'Todo bajo control',
        message: 'No hay alertas críticas. Buen trabajo hoy.',
        severity: 'info',
      });
    }

    return {
      generatedAt: now.toISOString(),
      items,
    };
  });
};
