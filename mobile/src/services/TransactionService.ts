import { USE_REMOTE_AUTH } from '../config/env';
import { apiFetch } from './ApiClient';
import { getDb } from './Database';

export type TransactionItem = {
  id: number;
  stationId: number;
  stationName?: string | null;
  vehicleId: number;
  vehiclePlate?: string | null;
  liters: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod?: string | null;
  reportedBy?: string | null;
  occurredAt: string;
  createdAt: string;
  analysis?: {
    status: string;
    score?: number;
    message?: string;
    zScore?: number | null;
  };
};

const buildAnalysis = (liters: number, capacity: number | null, history: number[]) => {
  if (capacity && liters > capacity * 1.05) {
    return {
      status: 'Infraccion',
      score: 95,
      message: 'Consumo supera la capacidad declarada del vehiculo.',
      zScore: null,
    };
  }

  if (history.length < 3) {
    return {
      status: 'Observacion',
      score: 55,
      message: 'Historial insuficiente para evaluar consumo del vehiculo.',
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
      status: 'Observacion',
      score: Math.max(score, 70),
      message: 'Consumo atipico respecto al historial del vehiculo.',
      zScore,
    };
  }

  return {
    status: 'Cumplimiento',
    score: Math.max(score, 20),
    message: 'Consumo dentro del rango esperado para el vehiculo.',
    zScore,
  };
};

const normalizeTransaction = (item: any): TransactionItem => ({
  id: item.id,
  stationId: item.stationId,
  stationName: item.station?.name ?? item.stationName ?? null,
  vehicleId: item.vehicleId,
  vehiclePlate: item.vehicle?.plate ?? item.vehiclePlate ?? null,
  liters: item.liters,
  unitPrice: item.unitPrice,
  totalAmount: item.totalAmount,
  paymentMethod: item.paymentMethod ?? null,
  reportedBy: item.reportedBy ?? null,
  occurredAt: item.occurredAt,
  createdAt: item.createdAt,
  analysis: item.analysis ?? undefined,
});

export const TransactionService = {
  getTransaction: async (id: number): Promise<TransactionItem | null> => {
    if (USE_REMOTE_AUTH) {
      return await apiFetch<TransactionItem>(`/transactions/${id}`);
    }
    const db = await getDb();
    const row = await db.getFirstAsync<any>(
      `SELECT t.id, t.stationId, s.name as stationName, t.vehicleId, v.plate as vehiclePlate,
              v.capacityLiters as capacityLiters,
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
              v.capacityLiters as capacityLiters,
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
