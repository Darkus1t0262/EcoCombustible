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

export const AuditService = {
  getAudits: async (): Promise<AuditItem[]> => {
    const db = await getDb();
    const rows = await db.getAllAsync<AuditItem>(
      `SELECT a.id, a.stationId, s.name as stationName, a.code, a.status,
              a.priceExpected, a.priceReported, a.dispenserOk, a.createdAt
       FROM audits a
       JOIN stations s ON s.id = a.stationId
       ORDER BY a.createdAt DESC;`
    );
    return (rows ?? []).map((row) => ({
      ...row,
      dispenserOk: Boolean(row.dispenserOk),
    }));
  },

  updateAuditStatus: async (auditId: number, status: 'approved' | 'rejected'): Promise<void> => {
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
