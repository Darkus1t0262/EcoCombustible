import { USE_REMOTE_AUTH } from '../config/env';
import { apiFetch, apiFetchWithMeta } from './ApiClient';
import { getDb } from './Database';

export type TransactionItem = {
  id: number;
  stationId: number;
  stationName?: string | null;
  vehicleId: number;
  vehiclePlate?: string | null;
  vehicleModel?: string | null;
  vehicleFuelType?: string | null;
  liters: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod?: string | null;
  reportedBy?: string | null;
  occurredAt: string;
  createdAt: string;
  riskScore?: number | null;
  riskLabel?: 'low' | 'medium' | 'high' | 'unknown' | null;
  mlVersion?: string | null;
  analysis?: {
    status: string;
    score?: number;
    message?: string;
    zScore?: number | null;
  };
};

export type TransactionQuery = {
  q?: string;
  stationId?: number;
  vehicleId?: number;
  riskLabel?: 'low' | 'medium' | 'high' | 'unknown';
};

const buildAnalysis = (liters: number, capacity: number | null, history: number[]) => {
  if (capacity && liters > capacity * 1.05) {
    return {
      status: 'Infracción',
      score: 95,
      message: 'Consumo supera la capacidad declarada del vehículo.',
      zScore: null,
    };
  }

  if (history.length < 3) {
    return {
      status: 'Observación',
      score: 55,
      message: 'Historial insuficiente para evaluar consumo del vehículo.',
      zScore: null,
    };
  }

  const mean = history.reduce((acc, value) => acc + value, 0) / history.length;
  const variance = history.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / history.length;
  const stdDev = Math.sqrt(variance);
  const zScore = stdDev === 0 ? 0 : (liters - mean) / stdDev;
  const score = Math.min(100, Math.round(Math.abs(zScore) * 18));

  if (Math.abs(zScore) >= 2.5) {
    return {
      status: 'Observación',
      score: Math.max(score, 70),
      message: 'Consumo atípico respecto al historial del vehículo.',
      zScore,
    };
  }

  return {
    status: 'Cumplimiento',
    score: Math.max(score, 20),
    message: 'Consumo dentro del rango esperado para el vehículo.',
    zScore,
  };
};

const normalizeTransaction = (item: any): TransactionItem => ({
  id: item.id,
  stationId: item.stationId,
  stationName: item.station?.name ?? item.stationName ?? null,
  vehicleId: item.vehicleId,
  vehiclePlate: item.vehicle?.plate ?? item.vehiclePlate ?? null,
  vehicleModel: item.vehicle?.model ?? item.vehicleModel ?? null,
  vehicleFuelType: item.vehicle?.fuelType ?? item.vehicleFuelType ?? null,
  liters: item.liters,
  unitPrice: item.unitPrice,
  totalAmount: item.totalAmount,
  paymentMethod: item.paymentMethod ?? null,
  reportedBy: item.reportedBy ?? null,
  occurredAt: item.occurredAt,
  createdAt: item.createdAt,
  riskScore: typeof item.riskScore === 'number' ? item.riskScore : null,
  riskLabel: item.riskLabel ?? null,
  mlVersion: item.mlVersion ?? null,
  analysis: item.analysis ?? undefined,
});

export const TransactionService = {
  getTransactionsPage: async (
    page: number,
    limit: number,
    query?: TransactionQuery
  ): Promise<{ items: TransactionItem[]; total?: number }> => {
    if (USE_REMOTE_AUTH) {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (typeof query?.stationId === 'number') {
        params.set('stationId', String(query.stationId));
      }
      if (typeof query?.vehicleId === 'number') {
        params.set('vehicleId', String(query.vehicleId));
      }
      if (query?.riskLabel) {
        params.set('riskLabel', query.riskLabel);
      }
      const normalizedQuery = query?.q?.trim();
      if (normalizedQuery) {
        params.set('q', normalizedQuery);
      }
      const response = await apiFetchWithMeta<any[]>(`/transactions?${params.toString()}`);
      return { items: response.data.map(normalizeTransaction), total: response.meta.total };
    }
    const db = await getDb();
    const clauses: string[] = [];
    const args: any[] = [];
    if (typeof query?.stationId === 'number') {
      clauses.push('t.stationId = ?');
      args.push(query.stationId);
    }
    if (typeof query?.vehicleId === 'number') {
      clauses.push('t.vehicleId = ?');
      args.push(query.vehicleId);
    }
    const normalizedQuery = query?.q?.trim().toLowerCase();
    if (normalizedQuery) {
      const like = `%${normalizedQuery}%`;
      clauses.push('(lower(s.name) LIKE ? OR lower(v.plate) LIKE ?)');
      args.push(like, like);
    }
    const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const totalRow = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM transactions t
       JOIN stations s ON s.id = t.stationId
       JOIN vehicles v ON v.id = t.vehicleId
       ${whereClause};`,
      ...args
    );
    const rows = await db.getAllAsync<any>(
      `SELECT t.id, t.stationId, s.name as stationName, t.vehicleId, v.plate as vehiclePlate,
              v.model as vehicleModel, v.fuelType as vehicleFuelType, v.capacityLiters as capacityLiters,
              t.liters, t.unitPrice, t.totalAmount, t.paymentMethod, t.reportedBy, t.occurredAt, t.createdAt
       FROM transactions t
       JOIN stations s ON s.id = t.stationId
       JOIN vehicles v ON v.id = t.vehicleId
       ${whereClause}
       ORDER BY t.occurredAt DESC
       LIMIT ? OFFSET ?;`,
      ...args,
      limit,
      (page - 1) * limit
    );
    const vehicleIds = Array.from(new Set((rows ?? []).map((row) => row.vehicleId)));
    const historyByVehicle = new Map<number, number[]>();
    if (vehicleIds.length > 0) {
      const placeholders = vehicleIds.map(() => '?').join(',');
      const historyRows = await db.getAllAsync<any>(
        `SELECT vehicleId, liters FROM transactions WHERE vehicleId IN (${placeholders}) ORDER BY occurredAt DESC;`,
        ...vehicleIds
      );
      for (const row of historyRows ?? []) {
        const list = historyByVehicle.get(row.vehicleId) ?? [];
        list.push(row.liters);
        historyByVehicle.set(row.vehicleId, list);
      }
    }
    return {
      items: (rows ?? []).map((row: any) => ({
        ...normalizeTransaction(row),
        analysis: buildAnalysis(row.liters, row.capacityLiters ?? null, historyByVehicle.get(row.vehicleId) ?? []),
      })),
      total: totalRow?.count ?? 0,
    };
  },
  getTransaction: async (id: number): Promise<TransactionItem | null> => {
    if (USE_REMOTE_AUTH) {
      const item = await apiFetch<any>(`/transactions/${id}`);
      return item ? normalizeTransaction(item) : null;
    }
    const db = await getDb();
    const row = await db.getFirstAsync<any>(
      `SELECT t.id, t.stationId, s.name as stationName, t.vehicleId, v.plate as vehiclePlate,
              v.model as vehicleModel, v.fuelType as vehicleFuelType, v.capacityLiters as capacityLiters,
              t.liters, t.unitPrice, t.totalAmount, t.paymentMethod, t.reportedBy, t.occurredAt, t.createdAt
       FROM transactions t
       JOIN stations s ON s.id = t.stationId
       JOIN vehicles v ON v.id = t.vehicleId
       WHERE t.id = ?;`,
      id
    );
    if (!row) {
      return null;
    }
    const historyRows = await db.getAllAsync<{ liters: number }>(
      'SELECT liters FROM transactions WHERE vehicleId = ? ORDER BY occurredAt DESC;',
      row.vehicleId
    );
    const history = (historyRows ?? []).map((item) => item.liters);
    return {
      ...normalizeTransaction(row),
      analysis: buildAnalysis(row.liters, row.capacityLiters ?? null, history),
    };
  },

  getTransactions: async (): Promise<TransactionItem[]> => {
    if (USE_REMOTE_AUTH) {
      const items = await apiFetch<any[]>('/transactions');
      return items.map(normalizeTransaction);
    }
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT t.id, t.stationId, s.name as stationName, t.vehicleId, v.plate as vehiclePlate,
              v.model as vehicleModel, v.fuelType as vehicleFuelType, v.capacityLiters as capacityLiters,
              t.liters, t.unitPrice, t.totalAmount, t.paymentMethod, t.reportedBy, t.occurredAt, t.createdAt
       FROM transactions t
       JOIN stations s ON s.id = t.stationId
       JOIN vehicles v ON v.id = t.vehicleId
       ORDER BY t.occurredAt DESC;`
    );
    const historyByVehicle = new Map<number, number[]>();
    for (const row of rows ?? []) {
      const list = historyByVehicle.get(row.vehicleId) ?? [];
      list.push(row.liters);
      historyByVehicle.set(row.vehicleId, list);
    }
    return (rows ?? []).map((row: any) => ({
      ...normalizeTransaction(row),
      analysis: buildAnalysis(row.liters, row.capacityLiters ?? null, historyByVehicle.get(row.vehicleId) ?? []),
    }));
  },
};
