import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createWriteStream } from 'node:fs';
import { stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { estimateSizeMb, REPORTS_DIR, safeFilename } from '../config/storage.js';
import { FILES_BASE_URL } from '../config/env.js';

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

export const registerReportRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/reports', { preHandler: [authenticate] }, async () => {
    const reports = await prisma.report.findMany({ orderBy: { createdAt: 'desc' } });
    return reports.map((report) => ({
      ...report,
      createdAt: report.createdAt.toISOString(),
    }));
  });

  fastify.post(
    '/reports',
    { preHandler: [authenticate, requireRole('supervisor')] },
    async (request, reply) => {
      const bodySchema = z.object({
        period: z.enum(['Semana', 'Mes', 'Anio']),
        format: z.enum(['PDF', 'Excel', 'CSV']),
      });
      const body = bodySchema.parse(request.body);

      const stations = await prisma.station.count();
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const auditsThisMonth = await prisma.audit.count({ where: { createdAt: { gte: start } } });
      const pendingComplaints = await prisma.complaint.count({ where: { status: 'pending' } });
      const summary = { stations, auditsThisMonth, pendingComplaints };

      const createdAt = new Date().toISOString();
      const baseName = safeFilename(`reporte_${body.period}_${body.format}_${Date.now()}`);
      let fileUrl: string | null = null;
      let mimeType: string | null = null;
      let filePath: string | null = null;

      if (body.format === 'PDF') {
        filePath = path.join(REPORTS_DIR, `${baseName}.pdf`);
        mimeType = 'application/pdf';
        await buildPdf(summary, createdAt, filePath);
      } else {
        filePath = path.join(REPORTS_DIR, `${baseName}.csv`);
        const csv = buildCsv(summary, createdAt);
        await writeFile(filePath, csv, 'utf8');
        mimeType = body.format === 'Excel' ? 'application/vnd.ms-excel' : 'text/csv';
      }

      if (filePath) {
        const stats = await stat(filePath);
        fileUrl = `${FILES_BASE_URL}/files/reports/${path.basename(filePath)}`;
        const report = await prisma.report.create({
          data: {
            period: body.period,
            format: body.format,
            createdAt: new Date(createdAt),
            sizeMb: estimateSizeMb(stats.size),
            fileUrl,
            mimeType,
          },
        });
        return reply.code(201).send({
          ...report,
          createdAt: report.createdAt.toISOString(),
        });
      }

      return reply.code(500).send({ error: 'Report generation failed' });
    }
  );
};
