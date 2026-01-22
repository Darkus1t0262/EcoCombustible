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

// Mapea filas SQLite a modelo de app.
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
  getStationsPage: async (page: number, limit: number): Promise<{ items: StationRow[]; total?: number }> => {
    // Si hay backend remoto, usa API; si no, lee desde SQLite.
    if (USE_REMOTE_AUTH) {
      const response = await apiFetchWithMeta<StationRow[]>(`/stations?page=${page}&limit=${limit}`);
      return { items: response.data, total: response.meta.total };
    }
    const db = await getDb();
    const totalRow = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM stations;');
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM stations ORDER BY name LIMIT ? OFFSET ?;',
      limit,
      (page - 1) * limit
    );
    return { items: (rows ?? []).map(mapStation), total: totalRow?.count ?? 0 };
  },
  getAllStations: async (): Promise<StationRow[]> => {
    // Ruta rapida para cargar todo el catalogo.
    if (USE_REMOTE_AUTH) {
      return await apiFetch<StationRow[]>('/stations');
    }
    const db = await getDb();
    const rows = await db.getAllAsync<any>('SELECT * FROM stations ORDER BY name;');
    return (rows ?? []).map(mapStation);
  },

  getStationDetails: async (id: number): Promise<StationRow | null> => {
    // Devuelve detalle desde API o cache local.
    if (USE_REMOTE_AUTH) {
      return await apiFetch<StationRow>(`/stations/${id}`);
    }
    const db = await getDb();
    const row = await db.getFirstAsync<any>('SELECT * FROM stations WHERE id = ?;', id);
    return row ? mapStation(row) : null;
  },
};
