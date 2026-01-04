import { USE_REMOTE_AUTH } from '../config/env';
import { buildApiUrl, getAuthHeaders } from './ApiClient';
import { getDb } from './Database';

export type ComplaintItem = {
  id: number;
  stationName: string;
  stationId?: number | null;
  type: string;
  detail: string | null;
  source?: string | null;
  reporterName?: string | null;
  reporterRole?: string | null;
  vehiclePlate?: string | null;
  vehicleModel?: string | null;
  fuelType?: string | null;
  vehicleId?: number | null;
  liters?: number | null;
  unitPrice?: number | null;
  totalAmount?: number | null;
  occurredAt?: string | null;
  transactionId?: number | null;
  photoUri?: string | null;
  photoUrl?: string | null;
  status: string;
  createdAt: string;
  resolvedAt?: string | null;
  resolutionNote?: string | null;
};

const normalizeComplaint = (item: any): ComplaintItem => ({
  id: item.id,
  stationName: item.stationName,
  stationId: item.stationId ?? null,
  type: item.type,
  detail: item.detail ?? null,
  source: item.source ?? null,
  reporterName: item.reporterName ?? null,
  reporterRole: item.reporterRole ?? null,
  vehiclePlate: item.vehiclePlate ?? null,
  vehicleModel: item.vehicleModel ?? null,
  fuelType: item.fuelType ?? null,
  vehicleId: item.vehicleId ?? null,
  liters: item.liters ?? null,
  unitPrice: item.unitPrice ?? null,
  totalAmount: item.totalAmount ?? null,
  occurredAt: item.occurredAt ?? null,
  transactionId: item.transactionId ?? null,
  photoUri: item.photoUri ?? null,
  photoUrl: item.photoUrl ?? null,
  status: item.status,
  createdAt: item.createdAt,
  resolvedAt: item.resolvedAt ?? null,
  resolutionNote: item.resolutionNote ?? null,
});

export const ComplaintService = {
  getComplaints: async (): Promise<ComplaintItem[]> => {
    if (USE_REMOTE_AUTH) {
      const headers = await getAuthHeaders();
      const response = await fetch(buildApiUrl('/complaints'), { headers: { Accept: 'application/json', ...headers } });
      if (!response.ok) {
        throw new Error('Failed to load complaints');
      }
      const items = (await response.json()) as any[];
      return items.map((item) => normalizeComplaint({ ...item, photoUri: item.photoUri ?? item.photoUrl ?? null }));
    }
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT id, stationName, stationId, type, detail, source, reporterName, reporterRole,
              vehiclePlate, vehicleModel, fuelType, vehicleId, liters, unitPrice, totalAmount, occurredAt,
              transactionId, photoUri, status, createdAt, resolvedAt, resolutionNote
       FROM complaints
       ORDER BY createdAt DESC;`
    );
    return (rows ?? []).map((row) => normalizeComplaint(row));
  },

  getComplaint: async (id: number): Promise<ComplaintItem | null> => {
    if (USE_REMOTE_AUTH) {
      const headers = await getAuthHeaders();
      const response = await fetch(buildApiUrl(`/complaints/${id}`), { headers: { Accept: 'application/json', ...headers } });
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to load complaint');
      }
      const item = await response.json();
      return normalizeComplaint({ ...item, photoUri: item.photoUri ?? item.photoUrl ?? null });
    }
    const db = await getDb();
    const row = await db.getFirstAsync<any>(
      `SELECT id, stationName, stationId, type, detail, source, reporterName, reporterRole,
              vehiclePlate, vehicleModel, fuelType, vehicleId, liters, unitPrice, totalAmount, occurredAt,
              transactionId, photoUri, status, createdAt, resolvedAt, resolutionNote
       FROM complaints
       WHERE id = ?;`,
      id
    );
    return row ? normalizeComplaint(row) : null;
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

  updateStatus: async (complaintId: number, status: 'pending' | 'resolved', resolutionNote?: string | null) => {
    if (USE_REMOTE_AUTH) {
      await apiFetch(`/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolutionNote }),
      });
      return;
    }
    const db = await getDb();
    const resolvedAt = status === 'resolved' ? new Date().toISOString() : null;
    await db.runAsync(
      'UPDATE complaints SET status = ?, resolvedAt = ?, resolutionNote = ? WHERE id = ?;',
      status,
      resolvedAt,
      resolutionNote ?? null,
      complaintId
    );
  },
};
