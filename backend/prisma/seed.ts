import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

const buildAddress = (props: Record<string, any>) => {
  const street = typeof props['addr:street'] === 'string' ? props['addr:street'].trim() : '';
  const number = typeof props['addr:housenumber'] === 'string' ? props['addr:housenumber'].trim() : '';
  const city = typeof props['addr:city'] === 'string' ? props['addr:city'].trim() : '';
  const parts: string[] = [];
  if (street) {
    parts.push(number ? `${street} ${number}` : street);
  }
  if (city) {
    parts.push(city);
  }
  return parts.join(', ');
};

const seed = async () => {
  const existingUser = await prisma.user.findFirst({ where: { username: 'admin' } });
  if (!existingUser) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash,
        name: 'Admin',
        role: 'admin',
        active: true,
      },
    });
  }

  const geojsonPath = path.join(__dirname, '..', 'export.geojson');
  const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));
  const stations = geojsonData.features
    .map((feature: any) => {
      const props = feature.properties ?? {};
      const coords = feature.geometry?.coordinates ?? [];
      const lng = Number(coords[0]);
      const lat = Number(coords[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
      }
      const rawName = typeof props.name === 'string' ? props.name.trim() : '';
      const osmId = props['@id'] ?? feature.id;
      const name = rawName || (osmId ? `Sin nombre ${osmId}` : 'Sin nombre');
      const address = buildAddress(props) || rawName || name;
      return {
        name,
        address,
        lat,
        lng,
        stock: 10000, // Valor por defecto
        price: 2.55, // Valor por defecto
        officialPrice: 2.55, // Valor por defecto
        history: [], // Array vacío por defecto
        lastAudit: null,
        status: 'Cumplimiento', // Estado por defecto
      };
    })
    .filter((station: any) => station !== null);

  for (const station of stations) {
    const existing = await prisma.station.findFirst({
      where: { name: station.name, lat: station.lat, lng: station.lng },
    });
    if (!existing) {
      await prisma.station.create({ data: station });
    }
  }

  const stationsSeed = await prisma.station.findMany();
  const stationMap = new Map(stationsSeed.map((s) => [s.name, s.id]));

  const vehicles = [
    {
      plate: 'PBA-1024',
      model: 'Toyota Hilux 2019',
      capacityLiters: 120,
      fuelType: 'Diésel',
      ownerName: 'Andrea G.',
    },
    {
      plate: 'ABC-5531',
      model: 'Chevrolet D-Max 2021',
      capacityLiters: 95,
      fuelType: 'Diésel',
      ownerName: 'Carlos D.',
    },
    {
      plate: 'GQX-2287',
      model: 'Kia Sportage 2018',
      capacityLiters: 60,
      fuelType: 'Extra',
      ownerName: 'Maria V.',
    },
    {
      plate: 'PCE-7740',
      model: 'Hyundai H1 2020',
      capacityLiters: 75,
      fuelType: 'Diésel',
      ownerName: 'Luis P.',
    },
  ];

  for (const vehicle of vehicles) {
    const exists = await prisma.vehicle.findFirst({ where: { plate: vehicle.plate } });
    if (!exists) {
      await prisma.vehicle.create({ data: vehicle });
    }
  }

  const vehiclesSeed = await prisma.vehicle.findMany();
  const vehicleMap = new Map(vehiclesSeed.map((v) => [v.plate, v.id]));

  const transactions = [
    {
      vehiclePlate: 'PBA-1024',
      stationName: 'Estación Frontera',
      liters: 180,
      unitPrice: 2.6,
      paymentMethod: 'Efectivo',
      reportedBy: 'cliente',
      occurredAt: new Date('2025-12-06T21:50:00.000Z'),
    },
    {
      vehiclePlate: 'ABC-5531',
      stationName: 'Estación Centro Sur',
      liters: 95,
      unitPrice: 2.55,
      paymentMethod: 'Tarjeta',
      reportedBy: 'sistema',
      occurredAt: new Date('2025-12-07T02:15:00.000Z'),
    },
    {
      vehiclePlate: 'GQX-2287',
      stationName: 'Gasolinera El Oro',
      liters: 40,
      unitPrice: 2.58,
      paymentMethod: 'Efectivo',
      reportedBy: 'cliente',
      occurredAt: new Date('2025-12-02T11:45:00.000Z'),
    },
    {
      vehiclePlate: 'PCE-7740',
      stationName: 'Estación Andina Sur',
      liters: 70,
      unitPrice: 2.55,
      paymentMethod: 'Credito',
      reportedBy: 'despachador',
      occurredAt: new Date('2025-12-04T15:20:00.000Z'),
    },
  ];

  for (const tx of transactions) {
    const vehicleId = vehicleMap.get(tx.vehiclePlate);
    const stationId = stationMap.get(tx.stationName);
    if (!vehicleId || !stationId) {
      continue;
    }
    const exists = await prisma.transaction.findFirst({
      where: { vehicleId, occurredAt: tx.occurredAt },
    });
    if (!exists) {
      await prisma.transaction.create({
        data: {
          vehicleId,
          stationId,
          liters: tx.liters,
          unitPrice: tx.unitPrice,
          totalAmount: Number((tx.liters * tx.unitPrice).toFixed(2)),
          paymentMethod: tx.paymentMethod,
          reportedBy: tx.reportedBy,
          occurredAt: tx.occurredAt,
        },
      });
    }
  }

  const transactionsSeed = await prisma.transaction.findMany();
  const transactionMap = new Map(
    transactionsSeed.map((t) => [`${t.vehicleId}|${t.occurredAt.toISOString()}`, t.id])
  );

  const txKey = (plate: string, iso: string) => {
    const vehicleId = vehicleMap.get(plate);
    if (!vehicleId) {
      return undefined;
    }
    return transactionMap.get(`${vehicleId}|${new Date(iso).toISOString()}`);
  };

  const audits = [
    {
      stationName: 'Estación Petroecuador Norte',
      code: 'AUD-2025-156',
      status: 'pending',
      priceExpected: 2.55,
      priceReported: 2.55,
      dispenserOk: true,
      createdAt: new Date('2025-12-01T10:20:00.000Z'),
    },
    {
      stationName: 'Gasolinera El Oro',
      code: 'AUD-2025-162',
      status: 'approved',
      priceExpected: 2.55,
      priceReported: 2.58,
      dispenserOk: false,
      createdAt: new Date('2025-12-02T15:10:00.000Z'),
    },
    {
      stationName: 'Estación Primax Centro',
      code: 'AUD-2025-170',
      status: 'pending',
      priceExpected: 2.55,
      priceReported: 2.55,
      dispenserOk: true,
      createdAt: new Date('2025-12-03T09:00:00.000Z'),
    },
    {
      stationName: 'Estación Andina Sur',
      code: 'AUD-2025-175',
      status: 'pending',
      priceExpected: 2.55,
      priceReported: 2.55,
      dispenserOk: true,
      createdAt: new Date('2025-12-04T09:30:00.000Z'),
    },
    {
      stationName: 'Gasolinera Rio Verde',
      code: 'AUD-2025-181',
      status: 'rejected',
      priceExpected: 2.55,
      priceReported: 2.62,
      dispenserOk: false,
      createdAt: new Date('2025-12-05T11:00:00.000Z'),
    },
    {
      stationName: 'Estación Sierra Norte',
      code: 'AUD-2025-189',
      status: 'approved',
      priceExpected: 2.55,
      priceReported: 2.55,
      dispenserOk: true,
      createdAt: new Date('2025-12-06T10:15:00.000Z'),
    },
    {
      stationName: 'Gasolinera Litoral',
      code: 'AUD-2025-192',
      status: 'pending',
      priceExpected: 2.55,
      priceReported: 2.75,
      dispenserOk: false,
      createdAt: new Date('2025-12-07T14:40:00.000Z'),
    },
    {
      stationName: 'Estación Frontera',
      code: 'AUD-2025-195',
      status: 'pending',
      priceExpected: 2.55,
      priceReported: 2.9,
      dispenserOk: false,
      createdAt: new Date('2025-12-08T08:10:00.000Z'),
    },
    {
      stationName: 'Gasolinera Valle',
      code: 'AUD-2025-201',
      status: 'approved',
      priceExpected: 2.55,
      priceReported: 2.55,
      dispenserOk: true,
      createdAt: new Date('2025-12-09T12:00:00.000Z'),
    },
    {
      stationName: 'Estación Centro Sur',
      code: 'AUD-2025-205',
      status: 'rejected',
      priceExpected: 2.55,
      priceReported: 2.7,
      dispenserOk: false,
      createdAt: new Date('2025-12-10T16:30:00.000Z'),
    },
    {
      stationName: 'Gasolinera Rio Verde',
      code: 'AUD-2025-208',
      status: 'approved',
      priceExpected: 2.55,
      priceReported: 2.55,
      dispenserOk: true,
      createdAt: new Date('2025-12-11T09:10:00.000Z'),
    },
    {
      stationName: 'Estación Pacifico',
      code: 'AUD-2025-211',
      status: 'pending',
      priceExpected: 2.55,
      priceReported: 2.55,
      dispenserOk: true,
      createdAt: new Date('2025-12-12T14:30:00.000Z'),
    },
  ];

  for (const audit of audits) {
    const exists = await prisma.audit.findFirst({ where: { code: audit.code } });
    if (!exists) {
      await prisma.audit.create({
        data: {
          stationId: stationMap.get(audit.stationName) ?? 1,
          code: audit.code,
          status: audit.status,
          priceExpected: audit.priceExpected,
          priceReported: audit.priceReported,
          dispenserOk: audit.dispenserOk,
          createdAt: audit.createdAt,
        },
      });
    }
  }

  const complaints = [
    {
      stationName: 'Gasolinera El Oro',
      stationId: stationMap.get('Gasolinera El Oro'),
      type: 'Precios irregulares',
      detail: 'El precio marcado no coincide con el publicado.',
      source: 'cliente',
      reporterName: 'Maria V.',
      reporterRole: 'cliente',
      status: 'pending',
      createdAt: new Date('2025-12-02T12:00:00.000Z'),
    },
    {
      stationName: 'Estación Primax Centro',
      stationId: stationMap.get('Estación Primax Centro'),
      type: 'Falta de stock',
      detail: 'No se despacha combustible en horas pico.',
      source: 'cliente',
      reporterName: 'Carlos D.',
      reporterRole: 'cliente',
      status: 'resolved',
      resolvedAt: new Date('2025-12-02T18:10:00.000Z'),
      resolutionNote: 'Se coordino reabastecimiento.',
      createdAt: new Date('2025-12-01T08:30:00.000Z'),
    },
    {
      stationName: 'Estación Andina Sur',
      stationId: stationMap.get('Estación Andina Sur'),
      type: 'Dispensador defectuoso',
      detail: 'El dispensador 2 marca menos de lo entregado.',
      source: 'despachador',
      reporterName: 'Luis P.',
      reporterRole: 'despachador',
      status: 'pending',
      createdAt: new Date('2025-12-04T16:45:00.000Z'),
    },
    {
      stationName: 'Gasolinera Litoral',
      stationId: stationMap.get('Gasolinera Litoral'),
      type: 'Precio fuera de rango',
      detail: 'Precio reportado superior al oficial.',
      source: 'sistema',
      reporterRole: 'sistema',
      status: 'pending',
      createdAt: new Date('2025-12-05T09:15:00.000Z'),
    },
    {
      stationName: 'Estación Frontera',
      stationId: stationMap.get('Estación Frontera'),
      type: 'Consumo inusual',
      detail: 'Carga fuera de rango para el vehículo.',
      source: 'cliente',
      reporterName: 'Andrea G.',
      reporterRole: 'cliente',
      vehiclePlate: 'PBA-1024',
      vehicleModel: 'Toyota Hilux 2019',
      fuelType: 'Diésel',
      vehicleId: vehicleMap.get('PBA-1024'),
      transactionId: txKey('PBA-1024', '2025-12-06T21:50:00.000Z'),
      liters: 180,
      unitPrice: 2.6,
      totalAmount: 468,
      occurredAt: new Date('2025-12-06T21:50:00.000Z'),
      status: 'pending',
      createdAt: new Date('2025-12-06T22:10:00.000Z'),
    },
    {
      stationName: 'Estación Sierra Norte',
      stationId: stationMap.get('Estación Sierra Norte'),
      type: 'Dispensador sin calibración',
      detail: 'La bomba 3 reporta menos volumen.',
      source: 'despachador',
      reporterName: 'Mario C.',
      reporterRole: 'despachador',
      status: 'pending',
      createdAt: new Date('2025-12-07T10:40:00.000Z'),
    },
    {
      stationName: 'Estación Centro Sur',
      stationId: stationMap.get('Estación Centro Sur'),
      type: 'Venta fuera de horario',
      detail: 'Transacción registrada a las 02:15.',
      source: 'sistema',
      reporterRole: 'sistema',
      vehiclePlate: 'ABC-5531',
      vehicleModel: 'Chevrolet D-Max 2021',
      fuelType: 'Diésel',
      vehicleId: vehicleMap.get('ABC-5531'),
      transactionId: txKey('ABC-5531', '2025-12-07T02:15:00.000Z'),
      liters: 95,
      unitPrice: 2.55,
      totalAmount: 242.25,
      occurredAt: new Date('2025-12-07T02:15:00.000Z'),
      status: 'pending',
      createdAt: new Date('2025-12-07T02:20:00.000Z'),
    },
    {
      stationName: 'Gasolinera Valle',
      stationId: stationMap.get('Gasolinera Valle'),
      type: 'Falta de factura',
      detail: 'El cliente no recibio comprobante.',
      source: 'cliente',
      reporterName: 'Jorge R.',
      reporterRole: 'cliente',
      status: 'resolved',
      resolvedAt: new Date('2025-12-08T11:30:00.000Z'),
      resolutionNote: 'Se emitio factura posterior.',
      createdAt: new Date('2025-12-08T09:05:00.000Z'),
    },
  ];

  for (const complaint of complaints) {
    const exists = await prisma.complaint.findFirst({
      where: { stationName: complaint.stationName, createdAt: complaint.createdAt },
    });
    if (!exists) {
      await prisma.complaint.create({
        data: {
          stationName: complaint.stationName,
          stationId: complaint.stationId ?? null,
          type: complaint.type,
          detail: complaint.detail ?? null,
          source: complaint.source ?? null,
          reporterName: complaint.reporterName ?? null,
          reporterRole: complaint.reporterRole ?? null,
          vehiclePlate: complaint.vehiclePlate ?? null,
          vehicleModel: complaint.vehicleModel ?? null,
          fuelType: complaint.fuelType ?? null,
          vehicleId: complaint.vehicleId ?? null,
          liters: complaint.liters ?? null,
          unitPrice: complaint.unitPrice ?? null,
          totalAmount: complaint.totalAmount ?? null,
          occurredAt: complaint.occurredAt ?? null,
          transactionId: complaint.transactionId ?? null,
          photoUrl: complaint.photoUrl ?? null,
          status: complaint.status,
          resolvedAt: complaint.resolvedAt ?? null,
          resolutionNote: complaint.resolutionNote ?? null,
          createdAt: complaint.createdAt,
        },
      });
    }
  }

  const reports = [
    {
      period: 'Mes',
      format: 'PDF',
      createdAt: new Date('2025-11-30T18:00:00.000Z'),
      sizeMb: 2.4,
    },
    {
      period: 'Semana',
      format: 'CSV',
      createdAt: new Date('2025-12-02T18:00:00.000Z'),
      sizeMb: 1.1,
    },
    {
      period: 'Mes',
      format: 'Excel',
      createdAt: new Date('2025-12-03T18:00:00.000Z'),
      sizeMb: 3.2,
    },
    {
      period: 'Semana',
      format: 'PDF',
      createdAt: new Date('2025-12-07T18:00:00.000Z'),
      sizeMb: 1.6,
    },
    {
      period: 'Año',
      format: 'CSV',
      createdAt: new Date('2025-12-08T18:00:00.000Z'),
      sizeMb: 4.2,
    },
  ];

  for (const report of reports) {
    const exists = await prisma.report.findFirst({
      where: { period: report.period, format: report.format, createdAt: report.createdAt },
    });
    if (!exists) {
      await prisma.report.create({ data: report });
    }
  }
};

seed()
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
