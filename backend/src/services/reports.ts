import { createWriteStream } from 'node:fs';
import { stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { prisma } from '../lib/prisma.js';
import { estimateSizeMb, REPORTS_DIR, safeFilename } from '../config/storage.js';
import { reportQueue } from '../lib/queue.js';
import { storeLocalFile } from './storage.js';

const buildCsv = (summary: { stations: number; auditsThisMonth: number; pendingComplaints: number }, createdAt: string) => {
  return [
    'metric,value',
    `stations,${summary.stations}`,
    `audits_this_month,${summary.auditsThisMonth}`,
    `pending_complaints,${summary.pendingComplaints}`,
    `generated_at,${createdAt}`,
  ].join('\n');
};

const buildPdf = async (
  summary: { stations: number; auditsThisMonth: number; pendingComplaints: number },
  createdAt: string,
  filePath: string
) => {
  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const stream = createWriteStream(filePath);
    doc.pipe(stream);
    doc.fontSize(18).text('EcoCombustible Reporte', { align: 'left' });
    doc.moveDown();
    doc.fontSize(12).text(`Generado: ${createdAt}`);
    doc.moveDown();
    doc.text(`Estaciones: ${summary.stations}`);
    doc.text(`Auditorias del mes: ${summary.auditsThisMonth}`);
    doc.text(`Quejas pendientes: ${summary.pendingComplaints}`);
    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', (err) => reject(err));
  });
};

export const generateReport = async (reportId: number) => {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) {
    throw new Error('Report not found');
  }

  await prisma.report.update({
    where: { id: reportId },
    data: { status: 'processing', error: null },
  });

  try {
    const stations = await prisma.station.count();
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const auditsThisMonth = await prisma.audit.count({ where: { createdAt: { gte: start } } });
    const pendingComplaints = await prisma.complaint.count({ where: { status: 'pending' } });
    const summary = { stations, auditsThisMonth, pendingComplaints };

    const createdAt = new Date().toISOString();
    const baseName = safeFilename(`reporte_${report.period}_${report.format}_${Date.now()}`);
    let fileUrl: string | null = null;
    let mimeType: string | null = null;
    let filePath: string | null = null;
    let filename: string | null = null;

    if (report.format === 'PDF') {
      filename = `${baseName}.pdf`;
      filePath = path.join(REPORTS_DIR, filename);
      mimeType = 'application/pdf';
      await buildPdf(summary, createdAt, filePath);
    } else {
      filename = `${baseName}.csv`;
      filePath = path.join(REPORTS_DIR, filename);
      const csv = buildCsv(summary, createdAt);
      await writeFile(filePath, csv, 'utf8');
      mimeType = report.format === 'Excel' ? 'application/vnd.ms-excel' : 'text/csv';
    }

    if (!filePath || !filename) {
      throw new Error('Report generation failed');
    }

    const stats = await stat(filePath);
    const stored = await storeLocalFile({
      category: 'reports',
      filename,
      filePath,
      contentType: mimeType,
    });
    fileUrl = stored.fileUrl;

    return await prisma.report.update({
      where: { id: reportId },
      data: {
        sizeMb: estimateSizeMb(stats.size),
        fileUrl,
        mimeType,
        status: 'ready',
        error: null,
      },
    });
  } catch (error) {
    await prisma.report.update({
      where: { id: reportId },
      data: { status: 'failed', error: (error as Error).message },
    });
    throw error;
  }
};

export const enqueueReportGeneration = async (reportId: number) => {
  await reportQueue.add(
    'generate-report',
    { reportId },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 50,
      removeOnFail: 50,
    }
  );
};
