import { USE_REMOTE_AUTH } from '../config/env';
import { apiFetch } from './ApiClient';
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
});

export const StationService = {
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
