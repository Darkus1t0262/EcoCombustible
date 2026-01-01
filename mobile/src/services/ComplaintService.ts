import { USE_REMOTE_AUTH } from '../config/env';
import { buildApiUrl, getAuthHeaders } from './ApiClient';
import { getDb } from './Database';

export type ComplaintItem = {
  id: number;
  stationName: string;
  type: string;
  detail: string | null;
  photoUri: string | null;
  status: string;
  createdAt: string;
};

export const ComplaintService = {
  getComplaints: async (): Promise<ComplaintItem[]> => {
    if (USE_REMOTE_AUTH) {
      const headers = await getAuthHeaders();
      const response = await fetch(buildApiUrl('/complaints'), { headers: { Accept: 'application/json', ...headers } });
      if (!response.ok) {
        throw new Error('Failed to load complaints');
      }
      const items = (await response.json()) as any[];
      return items.map((item) => ({
        ...item,
        photoUri: item.photoUri ?? item.photoUrl ?? null,
      })) as ComplaintItem[];
    }
    const db = await getDb();
    const rows = await db.getAllAsync<ComplaintItem>(
      'SELECT id, stationName, type, detail, photoUri, status, createdAt FROM complaints ORDER BY createdAt DESC;'
    );
    return rows ?? [];
  },

  getStats: async (): Promise<{ total: number; pending: number; resolved: number }> => {
    if (USE_REMOTE_AUTH) {
      const headers = await getAuthHeaders();
      const response = await fetch(buildApiUrl('/complaints/stats'), { headers: { Accept: 'application/json', ...headers } });
      if (!response.ok) {
        throw new Error('Failed to load stats');
      }
      return (await response.json()) as { total: number; pending: number; resolved: number };
    }
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

  createComplaint: async (payload: { stationName: string; type: string; detail: string; photoUri?: string | null }) => {
    if (USE_REMOTE_AUTH) {
      const headers = await getAuthHeaders();
      const form = new FormData();
      form.append('stationName', payload.stationName);
      form.append('type', payload.type);
      form.append('detail', payload.detail);
      if (payload.photoUri) {
        form.append('photo', {
          uri: payload.photoUri,
          name: `complaint_${Date.now()}.jpg`,
          type: 'image/jpeg',
        } as any);
      }

      const response = await fetch(buildApiUrl('/complaints'), {
        method: 'POST',
        headers,
        body: form,
      });

      if (!response.ok) {
        throw new Error('Failed to create complaint');
      }
      return;
    }
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO complaints (stationName, type, detail, photoUri, status, createdAt) VALUES (?, ?, ?, ?, ?, ?);',
      payload.stationName,
      payload.type,
      payload.detail,
      payload.photoUri ?? null,
      'pending',
      new Date().toISOString()
    );
  },
};
