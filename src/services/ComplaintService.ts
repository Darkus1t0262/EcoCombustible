import { getDb } from './Database';

export type ComplaintItem = {
  id: number;
  stationName: string;
  type: string;
  detail: string | null;
  status: string;
  createdAt: string;
};

export const ComplaintService = {
  getComplaints: async (): Promise<ComplaintItem[]> => {
    const db = await getDb();
    const rows = await db.getAllAsync<ComplaintItem>(
      'SELECT id, stationName, type, detail, status, createdAt FROM complaints ORDER BY createdAt DESC;'
    );
    return rows ?? [];
  },

  getStats: async (): Promise<{ total: number; pending: number; resolved: number }> => {
    const db = await getDb();
    const totalRow = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM complaints;');
    const pendingRow = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM complaints WHERE status = 'pending';"
    );
    const resolvedRow = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM complaints WHERE status = 'resolved';"
    );

    return {
      total: totalRow?.count ?? 0,
      pending: pendingRow?.count ?? 0,
      resolved: resolvedRow?.count ?? 0,
    };
  },

  createComplaint: async (payload: { stationName: string; type: string; detail: string }) => {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO complaints (stationName, type, detail, status, createdAt) VALUES (?, ?, ?, ?, ?);',
      payload.stationName,
      payload.type,
      payload.detail,
      'pending',
      new Date().toISOString()
    );
  },
};
