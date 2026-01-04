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

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  HOST: z.string().default('0.0.0.0'),
  JWT_SECRET: z.string().min(1).default('change_me'),
  JWT_ISSUER: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default('1d'),
  PUBLIC_BASE_URL: z.string().url().optional(),
  FILES_BASE_URL: z.string().url().optional(),
  CORS_ORIGIN: z.string().optional(),
  DATABASE_URL: z.string().min(1),
  TRUST_PROXY: z.string().optional(),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),
});

const env = envSchema.parse(process.env);
const PORT = env.PORT;
const HOST = env.HOST;
const JWT_SECRET = env.JWT_SECRET;
const PUBLIC_BASE_URL = (env.PUBLIC_BASE_URL ?? `http://localhost:${PORT}`).replace(/\/+$/, '');
const FILES_BASE_URL = (env.FILES_BASE_URL ?? PUBLIC_BASE_URL).replace(/\/+$/, '');
const CORS_ORIGIN = env.CORS_ORIGIN ?? '';
const TRUST_PROXY = env.TRUST_PROXY === 'true' || env.TRUST_PROXY === '1';
const JWT_ISSUER = env.JWT_ISSUER?.trim() || undefined;

if (env.NODE_ENV === 'production') {
  if (JWT_SECRET === 'change_me' || JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production.');
  }
  if (!env.PUBLIC_BASE_URL) {
    throw new Error('PUBLIC_BASE_URL must be set in production.');
  }
  if (!PUBLIC_BASE_URL.startsWith('https://')) {
    throw new Error('PUBLIC_BASE_URL must use https in production.');
  }
  if (env.FILES_BASE_URL && !FILES_BASE_URL.startsWith('https://')) {
    throw new Error('FILES_BASE_URL must use https in production.');
  }
  if (!CORS_ORIGIN) {
    throw new Error('CORS_ORIGIN must be set in production.');
  }
}
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
  const raw = CORS_ORIGIN.split(',').map((value) => value.trim()).filter(Boolean);
  if (raw.length === 0) {
    return env.NODE_ENV === 'production' ? false : true;
  }
  if (raw.includes('*')) {
    if (env.NODE_ENV === 'production') {
      throw new Error('CORS_ORIGIN cannot be wildcard in production.');
    }
    return true;
  }
  return raw.map((origin) => {
    try {
      return new URL(origin).origin;
    } catch (error) {
      throw new Error(`Invalid CORS origin: ${origin}`);
    }
  });
};

const fastify = Fastify({
  logger: {
    redact: ['req.headers.authorization'],
  },
  trustProxy: TRUST_PROXY,
});

await fastify.register(helmet, { global: true });
await fastify.register(cors, { origin: parseOrigins() });
await fastify.register(rateLimit, {
  global: true,
  max: env.RATE_LIMIT_MAX,
  timeWindow: env.RATE_LIMIT_WINDOW,
});
const jwtSignOptions: { expiresIn: string; issuer?: string } = {
  expiresIn: env.JWT_EXPIRES_IN,
};
if (JWT_ISSUER) {
  jwtSignOptions.issuer = JWT_ISSUER;
}
await fastify.register(jwt, {
  secret: JWT_SECRET,
  sign: jwtSignOptions,
  verify: JWT_ISSUER ? { issuer: JWT_ISSUER } : undefined,
});
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

const toNumberArray = (value: unknown): number[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => Number(item)).filter((item) => Number.isFinite(item));
};

const analyzeStation = (station: {
  price: number;
  officialPrice: number;
  history: unknown;
  stock: number;
}) => {
  const history = toNumberArray(station.history);
  const priceDelta = station.price - station.officialPrice;

  if (priceDelta > 0.01) {
    return {
      status: 'Infraccion',
      score: 90,
      message: 'Precio sobre el oficial reportado.',
      zScore: null,
    };
  }

  if (history.length < 3) {
    return {
      status: 'Observacion',
      score: 55,
      message: 'Historial insuficiente para evaluar consumo.',
      zScore: null,
    };
  }

  const mean = history.reduce((acc, value) => acc + value, 0) / history.length;
  const variance = history.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / history.length;
  const stdDev = Math.sqrt(variance);
  const current = history[history.length - 1] ?? station.stock ?? 0;
  const zScore = stdDev === 0 ? 0 : (current - mean) / stdDev;
  const score = Math.min(100, Math.round(Math.abs(zScore) * 18));

  if (Math.abs(zScore) >= 2.5) {
    return {
      status: 'Observacion',
      score: Math.max(score, 70),
      message: 'Variacion atipica en consumo frente al promedio.',
      zScore,
    };
  }

  return {
    status: 'Cumplimiento',
    score: Math.max(score, 20),
    message: 'Consumo dentro del rango esperado.',
    zScore,
  };
};

const analyzeTransaction = (
  transaction: { liters: number; vehicle?: { capacityLiters: number } },
  history: number[]
) => {
  const capacity = transaction.vehicle?.capacityLiters ?? 0;
  if (capacity > 0 && transaction.liters > capacity * 1.05) {
    return {
      status: 'Infraccion',
      score: 95,
      message: 'Consumo supera la capacidad declarada del vehiculo.',
      zScore: null,
    };
  }

  if (history.length < 3) {
    return {
      status: 'Observacion',
      score: 55,
      message: 'Historial insuficiente para evaluar consumo del vehiculo.',
      zScore: null,
    };
  }

  const mean = history.reduce((acc, value) => acc + value, 0) / history.length;
  const variance = history.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / history.length;
  const stdDev = Math.sqrt(variance);
  const zScore = stdDev === 0 ? 0 : (transaction.liters - mean) / stdDev;
  const score = Math.min(100, Math.round(Math.abs(zScore) * 18));

  if (Math.abs(zScore) >= 2.5) {
    return {
      status: 'Observacion',
      score: Math.max(score, 70),
      message: 'Consumo atipico respecto al historial del vehiculo.',
      zScore,
    };
  }

  return {
    status: 'Cumplimiento',
    score: Math.max(score, 20),
    message: 'Consumo dentro del rango esperado para el vehiculo.',
    zScore,
  };
};

const optionalString = () =>
  z.preprocess(
    (value) =>
      value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
        ? undefined
        : value,
    z.string().min(1).optional()
  );

const optionalNumber = () =>
  z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : value),
    z.coerce.number().optional()
  );

const optionalDate = () =>
  z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : value),
    z.coerce.date().optional()
  );

const formatComplaint = (complaint: any) => ({
  ...complaint,
  createdAt: complaint.createdAt?.toISOString?.() ?? complaint.createdAt,
  occurredAt: complaint.occurredAt ? complaint.occurredAt.toISOString() : null,
  resolvedAt: complaint.resolvedAt ? complaint.resolvedAt.toISOString() : null,
});

const formatTransaction = (transaction: any, analysis: any) => ({
  ...transaction,
  occurredAt: transaction.occurredAt?.toISOString?.() ?? transaction.occurredAt,
  createdAt: transaction.createdAt?.toISOString?.() ?? transaction.createdAt,
  analysis,
});

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
    analysis: analyzeStation(station),
  }));
});

fastify.get('/stations/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
  const params = paramsSchema.parse(request.params);
  const station = await prisma.station.findUnique({ where: { id: Number(params.id) } });
  if (!station) {
    return reply.code(404).send({ error: 'Not found' });
  }
  return { ...station, history: station.history ?? [], analysis: analyzeStation(station) };
});

fastify.get('/vehicles', { preHandler: [fastify.authenticate] }, async () => {
  const vehicles = await prisma.vehicle.findMany({ orderBy: { plate: 'asc' } });
  return vehicles.map((vehicle) => ({
    ...vehicle,
    createdAt: vehicle.createdAt.toISOString(),
  }));
});

fastify.get('/vehicles/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
  const params = paramsSchema.parse(request.params);
  const vehicle = await prisma.vehicle.findUnique({ where: { id: Number(params.id) } });
  if (!vehicle) {
    return reply.code(404).send({ error: 'Not found' });
  }
  return { ...vehicle, createdAt: vehicle.createdAt.toISOString() };
});

fastify.get('/vehicles/:id/transactions', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
  const params = paramsSchema.parse(request.params);
  const vehicleId = Number(params.id);
  const transactions = await prisma.transaction.findMany({
    where: { vehicleId },
    include: { station: true, vehicle: true },
    orderBy: { occurredAt: 'desc' },
  });
  const history = transactions.map((t) => t.liters);
  return transactions.map((transaction) =>
    formatTransaction(transaction, analyzeTransaction(transaction, history))
  );
});

fastify.get('/transactions', { preHandler: [fastify.authenticate] }, async () => {
  const transactions = await prisma.transaction.findMany({
    include: { station: true, vehicle: true },
    orderBy: { occurredAt: 'desc' },
  });
  const historyByVehicle = new Map<number, number[]>();
  for (const tx of transactions) {
    const list = historyByVehicle.get(tx.vehicleId) ?? [];
    list.push(tx.liters);
    historyByVehicle.set(tx.vehicleId, list);
  }
  return transactions.map((transaction) => {
    const history = historyByVehicle.get(transaction.vehicleId) ?? [];
    return formatTransaction(transaction, analyzeTransaction(transaction, history));
  });
});

fastify.get('/transactions/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
  const params = paramsSchema.parse(request.params);
  const transaction = await prisma.transaction.findUnique({
    where: { id: Number(params.id) },
    include: { station: true, vehicle: true },
  });
  if (!transaction) {
    return reply.code(404).send({ error: 'Not found' });
  }
  const history = await prisma.transaction.findMany({
    where: { vehicleId: transaction.vehicleId },
    orderBy: { occurredAt: 'desc' },
  });
  const litersHistory = history.map((item) => item.liters);
  return formatTransaction(transaction, analyzeTransaction(transaction, litersHistory));
});

fastify.post('/transactions', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const payloadSchema = z.object({
    stationId: optionalNumber(),
    stationName: optionalString(),
    vehiclePlate: z.string().min(2),
    vehicleModel: optionalString(),
    capacityLiters: optionalNumber(),
    fuelType: optionalString(),
    ownerName: optionalString(),
    liters: z.coerce.number().positive(),
    unitPrice: z.coerce.number().positive(),
    paymentMethod: optionalString(),
    reportedBy: optionalString(),
    occurredAt: optionalDate(),
  });

  const payload = payloadSchema.parse(request.body);
  let stationId = payload.stationId ? Math.trunc(payload.stationId) : null;
  if (!stationId && payload.stationName) {
    const station = await prisma.station.findFirst({ where: { name: payload.stationName } });
    stationId = station?.id ?? null;
  }
  if (!stationId) {
    return reply.code(400).send({ error: 'Station not found.' });
  }

  let vehicle = await prisma.vehicle.findFirst({ where: { plate: payload.vehiclePlate } });
  if (!vehicle) {
    if (!payload.vehicleModel || !payload.capacityLiters || !payload.fuelType) {
      return reply.code(400).send({ error: 'Vehicle data required for new plate.' });
    }
    vehicle = await prisma.vehicle.create({
      data: {
        plate: payload.vehiclePlate,
        model: payload.vehicleModel,
        capacityLiters: payload.capacityLiters,
        fuelType: payload.fuelType,
        ownerName: payload.ownerName ?? null,
      },
    });
  }

  const occurredAt = payload.occurredAt ?? new Date();
  const transaction = await prisma.transaction.create({
    data: {
      stationId,
      vehicleId: vehicle.id,
      liters: payload.liters,
      unitPrice: payload.unitPrice,
      totalAmount: Number((payload.liters * payload.unitPrice).toFixed(2)),
      paymentMethod: payload.paymentMethod ?? null,
      reportedBy: payload.reportedBy ?? null,
      occurredAt,
    },
  });

  const history = await prisma.transaction.findMany({
    where: { vehicleId: vehicle.id },
    orderBy: { occurredAt: 'desc' },
  });
  const litersHistory = history.map((item) => item.liters);
  return reply
    .code(201)
    .send(formatTransaction({ ...transaction, vehicle }, analyzeTransaction({ ...transaction, vehicle }, litersHistory)));
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
  return complaints.map(formatComplaint);
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
    stationId: optionalNumber(),
    type: z.string().min(2),
    detail: optionalString(),
    source: optionalString(),
    reporterName: optionalString(),
    reporterRole: optionalString(),
    vehiclePlate: optionalString(),
    vehicleModel: optionalString(),
    fuelType: optionalString(),
    vehicleId: optionalNumber(),
    liters: optionalNumber(),
    unitPrice: optionalNumber(),
    totalAmount: optionalNumber(),
    occurredAt: optionalDate(),
    transactionId: optionalNumber(),
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
        photoUrl = `${FILES_BASE_URL}/files/complaints/${storedName}`;
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
      stationId: payload.stationId === undefined ? null : Math.trunc(payload.stationId),
      type: payload.type,
      detail: payload.detail ?? null,
      source: payload.source ?? null,
      reporterName: payload.reporterName ?? null,
      reporterRole: payload.reporterRole ?? null,
      vehiclePlate: payload.vehiclePlate ?? null,
      vehicleModel: payload.vehicleModel ?? null,
      fuelType: payload.fuelType ?? null,
      vehicleId: payload.vehicleId === undefined ? null : Math.trunc(payload.vehicleId),
      liters: payload.liters ?? null,
      unitPrice: payload.unitPrice ?? null,
      totalAmount: payload.totalAmount ?? null,
      occurredAt: payload.occurredAt ?? null,
      transactionId: payload.transactionId === undefined ? null : Math.trunc(payload.transactionId),
      photoUrl,
      status: 'pending',
    },
  });

  return reply.code(201).send(formatComplaint(complaint));
});

fastify.get('/complaints/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
  const params = paramsSchema.parse(request.params);
  const complaint = await prisma.complaint.findUnique({ where: { id: Number(params.id) } });
  if (!complaint) {
    return reply.code(404).send({ error: 'Not found' });
  }
  return formatComplaint(complaint);
});

fastify.patch(
  '/complaints/:id',
  { preHandler: [fastify.authenticate, requireRole('supervisor')] },
  async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
    const bodySchema = z.object({
      status: z.enum(['pending', 'resolved']).optional(),
      resolutionNote: optionalString(),
    });
    const params = paramsSchema.parse(request.params);
    const body = bodySchema.parse(request.body);

    if (!body.status && !body.resolutionNote) {
      return reply.code(400).send({ error: 'No changes provided' });
    }

    const update: {
      status?: string;
      resolutionNote?: string | null;
      resolvedAt?: Date | null;
    } = {};

    if (body.status) {
      update.status = body.status;
      update.resolvedAt = body.status === 'resolved' ? new Date() : null;
    }
    if (body.resolutionNote !== undefined) {
      update.resolutionNote = body.resolutionNote ?? null;
    }

    const updated = await prisma.complaint.update({
      where: { id: Number(params.id) },
      data: update,
    });

    return formatComplaint(updated);
  }
);

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
