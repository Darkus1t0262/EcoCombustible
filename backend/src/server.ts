import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { stat, writeFile } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();

const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET ?? 'change_me';
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL ?? `http://localhost:${PORT}`;
const STORAGE_DIR = path.resolve(process.cwd(), 'storage');
const REPORTS_DIR = path.join(STORAGE_DIR, 'reports');
const COMPLAINTS_DIR = path.join(STORAGE_DIR, 'complaints');

const ensureDir = (dir: string) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
};

ensureDir(STORAGE_DIR);
ensureDir(REPORTS_DIR);
ensureDir(COMPLAINTS_DIR);

const parseOrigins = () => {
  const raw = (process.env.CORS_ORIGIN ?? '').split(',').map((value) => value.trim()).filter(Boolean);
  if (raw.length === 0) {
    return true;
  }
  return raw;
};

const fastify = Fastify({ logger: true });

if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'change_me') {
  throw new Error('JWT_SECRET must be set in production.');
}

await fastify.register(helmet, { global: true });
await fastify.register(cors, { origin: parseOrigins() });
await fastify.register(rateLimit, {
  global: true,
  max: 120,
  timeWindow: '1 minute',
});
await fastify.register(jwt, { secret: JWT_SECRET });
await fastify.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
await fastify.register(fastifyStatic, {
  root: STORAGE_DIR,
  prefix: '/files/',
  serve: false,
});

fastify.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify();
  } catch (error) {
    reply.code(401).send({ error: 'Unauthorized' });
    return;
  }
});

const requireRole = (role: string) => async (request: any, reply: any) => {
  const user = request.user as { role?: string } | undefined;
  if (!user?.role) {
    reply.code(403).send({ error: 'Forbidden' });
    return;
  }
  if (user.role !== role && user.role !== 'admin') {
    reply.code(403).send({ error: 'Forbidden' });
    return;
  }
};

const safeFilename = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

const estimateSizeMb = (sizeBytes: number) => Number((sizeBytes / (1024 * 1024)).toFixed(2));

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

fastify.get('/health', async () => ({ status: 'ok' }));

fastify.post(
  '/auth/login',
  {
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
  },
  async (request, reply) => {
    const bodySchema = z.object({
      username: z.string().min(1),
      password: z.string().min(1),
    });
    const body = bodySchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { username: body.username } });

    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const token = fastify.jwt.sign(
      { id: user.id, username: user.username, name: user.name, role: user.role },
      { expiresIn: '1d' }
    );

    return reply.send({
      user: { id: user.id, username: user.username, name: user.name, role: user.role },
      token,
    });
  }
);

fastify.get('/dashboard', { preHandler: [fastify.authenticate] }, async () => {
  const stations = await prisma.station.count();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const auditsThisMonth = await prisma.audit.count({ where: { createdAt: { gte: start } } });
  const pendingComplaints = await prisma.complaint.count({ where: { status: 'pending' } });
  return { stations, auditsThisMonth, pendingComplaints };
});

fastify.get('/stations', { preHandler: [fastify.authenticate] }, async () => {
  const stations = await prisma.station.findMany({ orderBy: { name: 'asc' } });
  return stations.map((station) => ({
    ...station,
    history: station.history ?? [],
  }));
});

fastify.get('/stations/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
  const params = paramsSchema.parse(request.params);
  const station = await prisma.station.findUnique({ where: { id: Number(params.id) } });
  if (!station) {
    return reply.code(404).send({ error: 'Not found' });
  }
  return { ...station, history: station.history ?? [] };
});

fastify.get('/audits', { preHandler: [fastify.authenticate] }, async () => {
  const audits = await prisma.audit.findMany({
    include: { station: true },
    orderBy: { createdAt: 'desc' },
  });
  return audits.map((audit) => ({
    id: audit.id,
    stationId: audit.stationId,
    stationName: audit.station.name,
    code: audit.code,
    status: audit.status,
    priceExpected: audit.priceExpected,
    priceReported: audit.priceReported,
    dispenserOk: audit.dispenserOk,
    createdAt: audit.createdAt.toISOString(),
  }));
});

fastify.patch(
  '/audits/:id',
  { preHandler: [fastify.authenticate, requireRole('supervisor')] },
  async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
    const bodySchema = z.object({ status: z.enum(['approved', 'rejected']) });
    const params = paramsSchema.parse(request.params);
    const body = bodySchema.parse(request.body);

    const audit = await prisma.audit.update({
      where: { id: Number(params.id) },
      data: { status: body.status },
    });

    if (body.status === 'approved') {
      await prisma.station.update({
        where: { id: audit.stationId },
        data: { lastAudit: new Date() },
      });
    }

    return { ok: true };
  }
);

fastify.get('/complaints', { preHandler: [fastify.authenticate] }, async () => {
  const complaints = await prisma.complaint.findMany({ orderBy: { createdAt: 'desc' } });
  return complaints.map((complaint) => ({
    ...complaint,
    createdAt: complaint.createdAt.toISOString(),
  }));
});

fastify.get('/complaints/stats', { preHandler: [fastify.authenticate] }, async () => {
  const total = await prisma.complaint.count();
  const pending = await prisma.complaint.count({ where: { status: 'pending' } });
  const resolved = await prisma.complaint.count({ where: { status: 'resolved' } });
  return { total, pending, resolved };
});

fastify.post('/complaints', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const payloadSchema = z.object({
    stationName: z.string().min(2),
    type: z.string().min(2),
    detail: z.string().optional().nullable(),
  });

  let payload: z.infer<typeof payloadSchema>;
  let photoUrl: string | null = null;

  if ((request as any).isMultipart?.()) {
    const fields: Record<string, string> = {};
    for await (const part of (request as any).parts()) {
      if (part.type === 'file') {
        if (part.mimetype && !part.mimetype.startsWith('image/')) {
          return reply.code(400).send({ error: 'Invalid file type' });
        }
        const fileName = safeFilename(part.filename ?? `photo_${Date.now()}.jpg`);
        const storedName = `${Date.now()}_${fileName}`;
        const destPath = path.join(COMPLAINTS_DIR, storedName);
        await pipeline(part.file, createWriteStream(destPath));
        photoUrl = `${PUBLIC_BASE_URL}/files/complaints/${storedName}`;
      } else {
        fields[part.fieldname] = String(part.value ?? '');
      }
    }
    payload = payloadSchema.parse(fields);
  } else {
    payload = payloadSchema.parse(request.body);
  }

  const complaint = await prisma.complaint.create({
    data: {
      stationName: payload.stationName,
      type: payload.type,
      detail: payload.detail ?? null,
      photoUrl,
      status: 'pending',
    },
  });

  return reply.code(201).send({
    ...complaint,
    createdAt: complaint.createdAt.toISOString(),
  });
});

fastify.get('/reports', { preHandler: [fastify.authenticate] }, async () => {
  const reports = await prisma.report.findMany({ orderBy: { createdAt: 'desc' } });
  return reports.map((report) => ({
    ...report,
    createdAt: report.createdAt.toISOString(),
  }));
});

fastify.post(
  '/reports',
  { preHandler: [fastify.authenticate, requireRole('supervisor')] },
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
      fileUrl = `${PUBLIC_BASE_URL}/files/reports/${path.basename(filePath)}`;
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

fastify.get('/files/:category/:filename', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const paramsSchema = z.object({
    category: z.enum(['reports', 'complaints']),
    filename: z.string().min(1),
  });
  const params = paramsSchema.parse(request.params);
  if (!/^[a-zA-Z0-9._-]+$/.test(params.filename)) {
    return reply.code(400).send({ error: 'Invalid filename' });
  }
  return reply.sendFile(`${params.category}/${params.filename}`);
});

fastify.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  const statusCode = error instanceof z.ZodError ? 400 : 500;
  reply.code(statusCode).send({ error: 'Unexpected error' });
});

fastify.setNotFoundHandler((request, reply) => {
  reply.code(404).send({ error: 'Not found' });
});

try {
  await fastify.listen({ port: PORT, host: HOST });
} catch (error) {
  fastify.log.error(error);
  process.exit(1);
}
