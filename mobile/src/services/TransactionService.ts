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
              t.liters, t.unitPrice, t.totalAmount, t.paymentMethod, t.reportedBy, t.occurredAt, t.createdAt
       FROM transactions t
       JOIN stations s ON s.id = t.stationId
       JOIN vehicles v ON v.id = t.vehicleId
       WHERE t.id = ?;`,
      id
    );
    return row ? normalizeTransaction(row) : null;
  },

  getTransactions: async (): Promise<TransactionItem[]> => {
    if (USE_REMOTE_AUTH) {
      const items = await apiFetch<any[]>('/transactions');
      return items.map(normalizeTransaction);
    }
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT t.id, t.stationId, s.name as stationName, t.vehicleId, v.plate as vehiclePlate,
              t.liters, t.unitPrice, t.totalAmount, t.paymentMethod, t.reportedBy, t.occurredAt, t.createdAt
       FROM transactions t
       JOIN stations s ON s.id = t.stationId
       JOIN vehicles v ON v.id = t.vehicleId
       ORDER BY t.occurredAt DESC;`
    );
    return (rows ?? []).map(normalizeTransaction);
  },
};
