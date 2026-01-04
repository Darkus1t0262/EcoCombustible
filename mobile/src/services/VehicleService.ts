import { USE_REMOTE_AUTH } from '../config/env';
import { apiFetch } from './ApiClient';
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
  analysis?: {
    status: string;
    score?: number;
    message?: string;
    zScore?: number | null;
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
  analysis: item.analysis ?? undefined,
});

export const VehicleService = {
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
              t.liters, t.unitPrice, t.totalAmount, t.paymentMethod, t.reportedBy, t.occurredAt, t.createdAt
       FROM transactions t
       JOIN stations s ON s.id = t.stationId
       JOIN vehicles v ON v.id = t.vehicleId
       WHERE t.vehicleId = ?
       ORDER BY t.occurredAt DESC;`,
      id
    );
    return (rows ?? []).map(normalizeTransaction);
  },
};
