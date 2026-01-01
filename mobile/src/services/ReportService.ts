import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { USE_REMOTE_AUTH } from '../config/env';
import { apiFetch, getAuthHeaders } from './ApiClient';
import { getDb } from './Database';

export type ReportItem = {
  id: number;
  period: string;
  format: string;
  createdAt: string;
  sizeMb: number;
  fileUri: string | null;
  fileUrl?: string | null;
  mimeType: string | null;
};

const estimateSizeMb = (period: string, format: string) => {
  const base = period === 'Semana' ? 1.2 : period === 'Mes' ? 2.6 : 4.8;
  const mult = format === 'CSV' ? 0.8 : format === 'Excel' ? 1.1 : 1.0;
  return Number((base * mult).toFixed(1));
};

const buildSummary = async (db: any) => {
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
};

const ensureReportsDir = async (): Promise<string> => {
  if (!FileSystem.documentDirectory) {
    throw new Error('Storage not available.');
  }
  const dir = `${FileSystem.documentDirectory}reports/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
};

const sanitizeToken = (value: string) => value.toLowerCase().replace(/\s+/g, '-');

const buildCsv = (summary: { stations: number; auditsThisMonth: number; pendingComplaints: number }, createdAt: string) => {
  return [
    'metric,value',
    `stations,${summary.stations}`,
    `audits_this_month,${summary.auditsThisMonth}`,
    `pending_complaints,${summary.pendingComplaints}`,
    `generated_at,${createdAt}`,
  ].join('\n');
};

const buildHtml = (summary: { stations: number; auditsThisMonth: number; pendingComplaints: number }, createdAt: string) => {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; padding: 24px;">
        <h2>EcoCombustible Reporte</h2>
        <p>Generado: ${createdAt}</p>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><th style="border: 1px solid #ddd; padding: 8px;">Metrica</th><th style="border: 1px solid #ddd; padding: 8px;">Valor</th></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px;">Estaciones</td><td style="border: 1px solid #ddd; padding: 8px;">${summary.stations}</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px;">Auditorias del mes</td><td style="border: 1px solid #ddd; padding: 8px;">${summary.auditsThisMonth}</td></tr>
          <tr><td style="border: 1px solid #ddd; padding: 8px;">Quejas pendientes</td><td style="border: 1px solid #ddd; padding: 8px;">${summary.pendingComplaints}</td></tr>
        </table>
      </body>
    </html>
  `;
};

export const ReportService = {
  getReports: async (): Promise<ReportItem[]> => {
    if (USE_REMOTE_AUTH) {
      const remote = await apiFetch<any[]>('/reports');
      return remote.map((report) => ({
        ...report,
        fileUri: report.fileUri ?? null,
        fileUrl: report.fileUrl ?? null,
        mimeType: report.mimeType ?? null,
      }));
    }
    const db = await getDb();
    const rows = await db.getAllAsync<ReportItem>(
      'SELECT id, period, format, createdAt, sizeMb, fileUri, mimeType FROM reports ORDER BY createdAt DESC;'
    );
    return rows ?? [];
  },

  createReport: async (period: string, format: string): Promise<ReportItem> => {
    if (USE_REMOTE_AUTH) {
      const created = await apiFetch<any>('/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, format }),
      });
      return {
        ...created,
        fileUri: created.fileUri ?? null,
        fileUrl: created.fileUrl ?? null,
        mimeType: created.mimeType ?? null,
      };
    }
    const db = await getDb();
    const createdAt = new Date().toISOString();
    const summary = await buildSummary(db);
    const dir = await ensureReportsDir();
    const safePeriod = sanitizeToken(period);
    const safeFormat = sanitizeToken(format);
    const baseName = `reporte_${safePeriod}_${safeFormat}_${Date.now()}`;
    let fileUri: string | null = null;
    let mimeType: string | null = null;

    if (format === 'PDF') {
      const result = await Print.printToFileAsync({ html: buildHtml(summary, createdAt) });
      fileUri = `${dir}${baseName}.pdf`;
      mimeType = 'application/pdf';
      await FileSystem.moveAsync({ from: result.uri, to: fileUri });
    } else {
      const csv = buildCsv(summary, createdAt);
      const extension = format === 'Excel' ? 'csv' : 'csv';
      fileUri = `${dir}${baseName}.${extension}`;
      mimeType = format === 'Excel' ? 'application/vnd.ms-excel' : 'text/csv';
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    }

    const sizeMb = estimateSizeMb(period, format);
    const result = await db.runAsync(
      'INSERT INTO reports (period, format, createdAt, sizeMb, fileUri, mimeType) VALUES (?, ?, ?, ?, ?, ?);',
      period,
      format,
      createdAt,
      sizeMb,
      fileUri,
      mimeType
    );

    return {
      id: Number(result.lastInsertRowId ?? 0),
      period,
      format,
      createdAt,
      sizeMb,
      fileUri,
      mimeType,
    };
  },

  shareReport: async (report: ReportItem): Promise<void> => {
    let uri = report.fileUri ?? null;
    if (!uri && report.fileUrl) {
      if (!FileSystem.documentDirectory) {
        throw new Error('Storage not available.');
      }
      const filename = `report_${report.id}_${Date.now()}`;
      const extension = report.mimeType === 'application/pdf' ? 'pdf' : 'csv';
      const dest = `${FileSystem.documentDirectory}reports/${filename}.${extension}`;
      await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}reports`, { intermediates: true });
      const headers = await getAuthHeaders();
      const result = await FileSystem.downloadAsync(report.fileUrl, dest, { headers });
      uri = result.uri;
    }

    if (!uri) {
      throw new Error('Report file not found.');
    }

    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) {
      throw new Error('Report file not found.');
    }

    const available = await Sharing.isAvailableAsync();
    if (!available) {
      throw new Error('Sharing not available.');
    }
    await Sharing.shareAsync(uri, {
      mimeType: report.mimeType ?? undefined,
      dialogTitle: 'Compartir reporte',
    });
  },
};
