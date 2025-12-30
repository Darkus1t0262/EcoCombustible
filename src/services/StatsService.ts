import { getDb } from './Database';

export const StatsService = {
  getDashboardStats: async (): Promise<{ stations: number; auditsThisMonth: number; pendingComplaints: number }> => {
    const db = await getDb();
    const stationsRow = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM stations;');
    const auditsRow = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM audits WHERE strftime('%Y-%m', createdAt) = strftime('%Y-%m', 'now');"
    );
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
