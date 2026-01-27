import { USE_REMOTE_AUTH } from '../config/env';
import { apiFetch } from './ApiClient';
import { getDb } from './Database';

export type InsightItem = {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  action?: {
    label: string;
    route: string;
  };
};

export type InsightsResponse = {
  generatedAt: string;
  items: InsightItem[];
};

const buildItems = (data: {
  pendingComplaints: number;
  pendingAudits: number;
  highRiskTransactions: number;
  reportsToday: number;
}): InsightItem[] => {
  const items: InsightItem[] = [];

  if (data.pendingComplaints > 0) {
    items.push({
      id: 'complaints-pending',
      title: 'Denuncias por revisar',
      message: `Hay ${data.pendingComplaints} denuncias pendientes. ¿Quieres verlas ahora?`,
      severity: data.pendingComplaints >= 6 ? 'critical' : 'warning',
      action: { label: 'Ver denuncias', route: 'Complaints' },
    });
  }

  if (data.pendingAudits > 0) {
    items.push({
      id: 'audits-pending',
      title: 'Auditorías en seguimiento',
      message: `Tienes ${data.pendingAudits} auditorías pendientes de cierre.`,
      severity: data.pendingAudits >= 5 ? 'critical' : 'warning',
      action: { label: 'Ver auditorías', route: 'Audit' },
    });
  }

  if (data.highRiskTransactions > 0) {
    items.push({
      id: 'transactions-high-risk',
      title: 'Transacciones con riesgo alto',
      message: `${data.highRiskTransactions} transacciones de alto riesgo en los últimos 7 días.`,
      severity: 'critical',
      action: { label: 'Ver transacciones', route: 'TransactionList' },
    });
  }

  if (data.reportsToday === 0) {
    items.push({
      id: 'reports-missing',
      title: 'Reporte diario pendiente',
      message: 'Aún no se generó el reporte de hoy.',
      severity: 'info',
      action: { label: 'Ir a reportes', route: 'Reports' },
    });
  }

  if (items.length === 0) {
    items.push({
      id: 'all-clear',
      title: 'Todo bajo control',
      message: 'No hay alertas críticas. Buen trabajo hoy.',
      severity: 'info',
    });
  }

  return items;
};

export const InsightsService = {
  getInsights: async (): Promise<InsightsResponse> => {
    if (USE_REMOTE_AUTH) {
      return await apiFetch<InsightsResponse>('/insights');
    }

    const db = await getDb();
    const complaintsRow = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM complaints WHERE status = 'pending';"
    );
    const auditsRow = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM audits WHERE status = 'pending';"
    );
    const reportsRow = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM reports WHERE strftime('%Y-%m-%d', createdAt) = strftime('%Y-%m-%d', 'now');"
    );
    const highRiskRow = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM transactions t
       JOIN vehicles v ON v.id = t.vehicleId
       WHERE t.liters > v.capacityLiters * 1.05
         AND strftime('%Y-%m-%d', t.occurredAt) >= strftime('%Y-%m-%d', 'now', '-7 day');`
    );

    const data = {
      pendingComplaints: complaintsRow?.count ?? 0,
      pendingAudits: auditsRow?.count ?? 0,
      highRiskTransactions: highRiskRow?.count ?? 0,
      reportsToday: reportsRow?.count ?? 0,
    };

    return {
      generatedAt: new Date().toISOString(),
      items: buildItems(data),
    };
  },
};
