import { USE_REMOTE_AUTH } from '../config/env';
import { apiFetch, apiFetchWithMeta, buildApiUrl, getAuthHeaders } from './ApiClient';
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

export type ComplaintCreateInput = {
  stationName: string;
  type: string;
  detail?: string | null;
  reporterName?: string | null;
  reporterRole?: string | null;
  vehiclePlate?: string | null;
  vehicleModel?: string | null;
  fuelType?: string | null;
  liters?: number | null;
  unitPrice?: number | null;
  totalAmount?: number | null;
  occurredAt?: string | null;
};

export type ComplaintQuery = {
  q?: string;
  status?: 'pending' | 'resolved';
  stationId?: number;
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

const calcTotalAmount = (liters?: number | null, unitPrice?: number | null, total?: number | null) => {
  if (typeof total === 'number' && Number.isFinite(total)) {
    return Number(total.toFixed(2));
  }
  if (typeof liters === 'number' && typeof unitPrice === 'number') {
    return Number((liters * unitPrice).toFixed(2));
  }
  return null;
};

export const ComplaintService = {
  getComplaintsPage: async (
    page: number,
    limit: number,
    query?: ComplaintQuery
  ): Promise<{ items: ComplaintItem[]; total?: number }> => {
    if (USE_REMOTE_AUTH) {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
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
      const response = await apiFetchWithMeta<any[]>(`/complaints?${params.toString()}`);
      return {
        items: response.data.map((item) => normalizeComplaint({ ...item, photoUri: item.photoUri ?? item.photoUrl ?? null })),
        total: response.meta.total,
      };
    }
    const db = await getDb();
    const clauses: string[] = [];
    const args: any[] = [];
    if (query?.status) {
      clauses.push('status = ?');
      args.push(query.status);
    }
    if (typeof query?.stationId === 'number') {
      clauses.push('stationId = ?');
      args.push(query.stationId);
    }
    const normalizedQuery = query?.q?.trim().toLowerCase();
    if (normalizedQuery) {
      const like = `%${normalizedQuery}%`;
      clauses.push(
        `(lower(stationName) LIKE ? OR lower(type) LIKE ? OR lower(reporterName) LIKE ? OR lower(vehiclePlate) LIKE ? OR lower(vehicleModel) LIKE ?)`
      );
      args.push(like, like, like, like, like);
    }
    const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const totalRow = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM complaints ${whereClause};`,
      ...args
    );
    const rows = await db.getAllAsync<any>(
      `SELECT id, stationName, stationId, type, detail, source, reporterName, reporterRole,
              vehiclePlate, vehicleModel, fuelType, vehicleId, liters, unitPrice, totalAmount, occurredAt,
              transactionId, photoUri, status, createdAt, resolvedAt, resolutionNote
       FROM complaints
       ${whereClause}
       ORDER BY createdAt DESC
       LIMIT ? OFFSET ?;`,
      ...args,
      limit,
      (page - 1) * limit
    );
    return { items: (rows ?? []).map((row) => normalizeComplaint(row)), total: totalRow?.count ?? 0 };
  },
  createComplaint: async (input: ComplaintCreateInput): Promise<ComplaintItem> => {
    const payload = {
      stationName: input.stationName.trim(),
      type: input.type.trim(),
      detail: input.detail ?? undefined,
      reporterName: input.reporterName ?? undefined,
      reporterRole: input.reporterRole ?? undefined,
      vehiclePlate: input.vehiclePlate ?? undefined,
      vehicleModel: input.vehicleModel ?? undefined,
      fuelType: input.fuelType ?? undefined,
      liters: input.liters ?? undefined,
      unitPrice: input.unitPrice ?? undefined,
      totalAmount: calcTotalAmount(input.liters, input.unitPrice, input.totalAmount) ?? undefined,
      occurredAt: input.occurredAt ?? undefined,
    };

    if (USE_REMOTE_AUTH) {
      const created = await apiFetch<any>('/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return normalizeComplaint({ ...created, photoUri: created.photoUri ?? created.photoUrl ?? null });
    }

    const db = await getDb();
    const createdAt = new Date().toISOString();
    const totalAmount = calcTotalAmount(input.liters, input.unitPrice, input.totalAmount);
    const result = await db.runAsync(
      `INSERT INTO complaints (
         stationName, stationId, type, detail, source, reporterName, reporterRole,
         vehiclePlate, vehicleModel, fuelType, vehicleId, liters, unitPrice, totalAmount,
         occurredAt, transactionId, photoUri, status, resolvedAt, resolutionNote, createdAt
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      input.stationName,
      null,
      input.type,
      input.detail ?? null,
      null,
      input.reporterName ?? null,
      input.reporterRole ?? null,
      input.vehiclePlate ?? null,
      input.vehicleModel ?? null,
      input.fuelType ?? null,
      null,
      input.liters ?? null,
      input.unitPrice ?? null,
      totalAmount ?? null,
      input.occurredAt ?? null,
      null,
      null,
      'pending',
      null,
      null,
      createdAt
    );

    return normalizeComplaint({
      id: Number(result.lastInsertRowId ?? 0),
      stationName: input.stationName,
      type: input.type,
      detail: input.detail ?? null,
      source: null,
      reporterName: input.reporterName ?? null,
      reporterRole: input.reporterRole ?? null,
      vehiclePlate: input.vehiclePlate ?? null,
      vehicleModel: input.vehicleModel ?? null,
      fuelType: input.fuelType ?? null,
      vehicleId: null,
      liters: input.liters ?? null,
      unitPrice: input.unitPrice ?? null,
      totalAmount: totalAmount ?? null,
      occurredAt: input.occurredAt ?? null,
      transactionId: null,
      photoUri: null,
      status: 'pending',
      createdAt,
      resolvedAt: null,
      resolutionNote: null,
    });
  },

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
