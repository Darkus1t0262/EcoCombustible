import { USE_REMOTE_AUTH } from '../config/env';
import { apiFetch } from './ApiClient';
import { getDb } from './Database';

export const StatsService = {
  getDashboardStats: async (): Promise<{ stations: number; auditsThisMonth: number; pendingComplaints: number }> => {
    if (USE_REMOTE_AUTH) {
      return await apiFetch('/dashboard');
    }
    const db = await getDb();
    const stationsRow = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM stations;');
    const auditsRow = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM audits;');
    const complaintsRow = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM complaints WHERE status = 'pending';"
    );

    return {
      stations: stationsRow?.count ?? 0,
      auditsThisMonth: auditsRow?.count ?? 0,
      pendingComplaints: complaintsRow?.count ?? 0,
    };
  },
};
