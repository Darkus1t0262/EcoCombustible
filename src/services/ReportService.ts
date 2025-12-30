import { getDb } from './Database';

export type ReportItem = {
  id: number;
  period: string;
  format: string;
  createdAt: string;
  sizeMb: number;
};

const estimateSizeMb = (period: string, format: string) => {
  const base = period === 'Semana' ? 1.2 : period === 'Mes' ? 2.6 : 4.8;
  const mult = format === 'CSV' ? 0.8 : format === 'Excel' ? 1.1 : 1.0;
  return Number((base * mult).toFixed(1));
};

export const ReportService = {
  getReports: async (): Promise<ReportItem[]> => {
    const db = await getDb();
    const rows = await db.getAllAsync<ReportItem>(
      'SELECT id, period, format, createdAt, sizeMb FROM reports ORDER BY createdAt DESC;'
    );
    return rows ?? [];
  },

  createReport: async (period: string, format: string): Promise<void> => {
    const db = await getDb();
    const sizeMb = estimateSizeMb(period, format);
    await db.runAsync(
      'INSERT INTO reports (period, format, createdAt, sizeMb) VALUES (?, ?, ?, ?);',
      period,
      format,
      new Date().toISOString(),
      sizeMb
    );
  },
};
