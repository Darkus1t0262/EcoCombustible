import { USE_REMOTE_AUTH } from '../config/env';
import { apiFetch, apiFetchWithMeta } from './ApiClient';
import { getDb } from './Database';

export type VehicleItem = {
  id: number;
  plate: string;
  model: string;
  capacityLiters: number;
  fuelType: string;
  ownerName?: string | null;
  createdAt: string;
};

export type VehicleTransaction = {
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

const normalizeTransaction = (item: any): VehicleTransaction => ({
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
  riskScore: typeof item.riskScore === 'number' ? item.riskScore : null,
  riskLabel: item.riskLabel ?? null,
  mlVersion: item.mlVersion ?? null,
  analysis: item.analysis ?? undefined,
});

export const VehicleService = {
  getVehiclesPage: async (page: number, limit: number): Promise<{ items: VehicleItem[]; total?: number }> => {
    if (USE_REMOTE_AUTH) {
      const response = await apiFetchWithMeta<VehicleItem[]>(`/vehicles?page=${page}&limit=${limit}`);
      return { items: response.data, total: response.meta.total };
    }
    const db = await getDb();
    const totalRow = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM vehicles;');
    const rows = await db.getAllAsync<VehicleItem>(
      'SELECT id, plate, model, capacityLiters, fuelType, ownerName, createdAt FROM vehicles ORDER BY plate LIMIT ? OFFSET ?;',
      limit,
      (page - 1) * limit
    );
    return { items: rows ?? [], total: totalRow?.count ?? 0 };
  },
  getVehicles: async (): Promise<VehicleItem[]> => {
    if (USE_REMOTE_AUTH) {
      return await apiFetch<VehicleItem[]>('/vehicles');
    }
    const db = await getDb();
    const rows = await db.getAllAsync<VehicleItem>(
      'SELECT id, plate, model, capacityLiters, fuelType, ownerName, createdAt FROM vehicles ORDER BY plate;'
    );
    return rows ?? [];
  },

  getVehicle: async (id: number): Promise<VehicleItem | null> => {
    if (USE_REMOTE_AUTH) {
      return await apiFetch<VehicleItem>(`/vehicles/${id}`);
    }
    const db = await getDb();
    const row = await db.getFirstAsync<VehicleItem>(
      'SELECT id, plate, model, capacityLiters, fuelType, ownerName, createdAt FROM vehicles WHERE id = ?;',
      id
    );
    return row ?? null;
  },

  getVehicleTransactions: async (id: number): Promise<VehicleTransaction[]> => {
    if (USE_REMOTE_AUTH) {
      const items = await apiFetch<any[]>(`/vehicles/${id}/transactions`);
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
       WHERE t.vehicleId = ?
       ORDER BY t.occurredAt DESC;`,
      id
    );
    const history = (rows ?? []).map((row: any) => row.liters);
    return (rows ?? []).map((row: any) => ({
      ...normalizeTransaction(row),
      analysis: buildAnalysis(row.liters, row.capacityLiters ?? null, history),
    }));
  },
};
