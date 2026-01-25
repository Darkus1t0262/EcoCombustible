import { USE_REMOTE_AUTH } from '../config/env';
import { apiFetch } from './ApiClient';
import { getDb } from './Database';

export type AuditItem = {
  id: number;
  stationId: number;
  stationName: string;
  code: string;
  status: string;
  priceExpected: number;
  priceReported: number;
  dispenserOk: boolean;
  createdAt: string;
};

export type AuditQuery = {
  q?: string;
  status?: 'pending' | 'approved' | 'rejected';
  stationId?: number;
};

export const AuditService = {
  getAudits: async (query?: AuditQuery): Promise<AuditItem[]> => {
    if (USE_REMOTE_AUTH) {
      const params = new URLSearchParams();
      if (query?.status) {
        params.set('status', query.status);
      }
      if (typeof query?.stationId === 'number') {
        params.set('stationId', String(query.stationId));
      }
      const normalizedQuery = query?.q?.trim();
      if (normalizedQuery) {
        params.set('q', normalizedQuery);
      }
      const suffix = params.toString();
      return await apiFetch<AuditItem[]>(suffix ? `/audits?${suffix}` : '/audits');
    }
    const db = await getDb();
    const clauses: string[] = [];
    const args: any[] = [];
    if (query?.status) {
      clauses.push('a.status = ?');
      args.push(query.status);
    }
    if (typeof query?.stationId === 'number') {
      clauses.push('a.stationId = ?');
      args.push(query.stationId);
    }
    const normalizedQuery = query?.q?.trim().toLowerCase();
    if (normalizedQuery) {
      const like = `%${normalizedQuery}%`;
      clauses.push('(lower(a.code) LIKE ? OR lower(s.name) LIKE ?)');
      args.push(like, like);
    }
    const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = await db.getAllAsync<AuditItem>(
      `SELECT a.id, a.stationId, s.name as stationName, a.code, a.status,
              a.priceExpected, a.priceReported, a.dispenserOk, a.createdAt
       FROM audits a
       JOIN stations s ON s.id = a.stationId
       ${whereClause}
       ORDER BY a.createdAt DESC;`,
      ...args
    );
    return (rows ?? []).map((row) => ({
      ...row,
      dispenserOk: Boolean(row.dispenserOk),
    }));
  },

  updateAuditStatus: async (auditId: number, status: 'approved' | 'rejected'): Promise<void> => {
    if (USE_REMOTE_AUTH) {
      await apiFetch(`/audits/${auditId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      return;
    }
    const db = await getDb();
    await db.runAsync('UPDATE audits SET status = ? WHERE id = ?;', status, auditId);

    if (status === 'approved') {
      const audit = await db.getFirstAsync<{ stationId: number }>(
        'SELECT stationId FROM audits WHERE id = ?;',
        auditId
      );
      if (audit?.stationId) {
        await db.runAsync(
          'UPDATE stations SET lastAudit = ? WHERE id = ?;',
          new Date().toISOString().slice(0, 10),
          audit.stationId
        );
      }
    }
  },
};
