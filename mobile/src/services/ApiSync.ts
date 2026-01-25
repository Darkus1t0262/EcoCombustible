import { USE_REMOTE_AUTH } from '../config/env';
import { apiFetch, apiFetchWithMeta } from './ApiClient';
import { getDb } from './Database';

export type StationRow = {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  stock: number;
  price: number;
  officialPrice: number;
  history: number[];
  lastAudit: string;
  status: string;
  analysis?: {
    status: string;
    score?: number;
    message?: string;
    zScore?: number | null;
  };
};

const mapStation = (row: any): StationRow => ({
  id: row.id,
  name: row.name,
  address: row.address,
  lat: row.lat,
  lng: row.lng,
  stock: row.stock,
  price: row.price,
  officialPrice: row.officialPrice,
  history: row.history ? JSON.parse(row.history) : [],
  lastAudit: row.lastAudit,
  status: row.status,
  analysis: row.analysis ?? undefined,
});

export const StationService = {
  getStationsPage: async (
    page: number,
    limit: number,
    query?: { q?: string }
  ): Promise<{ items: StationRow[]; total?: number }> => {
    if (USE_REMOTE_AUTH) {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      const normalizedQuery = query?.q?.trim();
      if (normalizedQuery) {
        params.set('q', normalizedQuery);
      }
      const response = await apiFetchWithMeta<StationRow[]>(`/stations?${params.toString()}`);
      return { items: response.data, total: response.meta.total };
    }
    const db = await getDb();
    const clauses: string[] = [];
    const args: any[] = [];
    const normalizedQuery = query?.q?.trim().toLowerCase();
    if (normalizedQuery) {
      const like = `%${normalizedQuery}%`;
      clauses.push('(lower(name) LIKE ? OR lower(address) LIKE ?)');
      args.push(like, like);
    }
    const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const totalRow = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM stations ${whereClause};`,
      ...args
    );
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM stations ${whereClause} ORDER BY name LIMIT ? OFFSET ?;`,
      ...args,
      limit,
      (page - 1) * limit
    );
    return { items: (rows ?? []).map(mapStation), total: totalRow?.count ?? 0 };
  },
  getAllStations: async (): Promise<StationRow[]> => {
    if (USE_REMOTE_AUTH) {
      return await apiFetch<StationRow[]>('/stations');
    }
    const db = await getDb();
    const rows = await db.getAllAsync<any>('SELECT * FROM stations ORDER BY name;');
    return (rows ?? []).map(mapStation);
  },

  getStationDetails: async (id: number): Promise<StationRow | null> => {
    if (USE_REMOTE_AUTH) {
      return await apiFetch<StationRow>(`/stations/${id}`);
    }
    const db = await getDb();
    const row = await db.getFirstAsync<any>('SELECT * FROM stations WHERE id = ?;', id);
    return row ? mapStation(row) : null;
  },
};
