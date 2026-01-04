import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
const DB_NAME = 'ecocombustible.db';
const DB_VERSION = 4;

export const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
};

const seedStations = [
  {
    id: 1,
    name: 'Estacion Petroecuador Norte',
    address: 'Av. 6 de Diciembre, Quito',
    lat: -0.1807,
    lng: -78.4678,
    stock: 15000,
    price: 2.55,
    officialPrice: 2.55,
    history: [1200, 1150, 1220, 1180, 1210],
    lastAudit: '2025-11-28',
    status: 'Cumplimiento',
  },
  {
    id: 2,
    name: 'Gasolinera El Oro',
    address: 'Machala, Centro',
    lat: -3.2581,
    lng: -79.9551,
    stock: 45000,
    price: 2.58,
    officialPrice: 2.55,
    history: [300, 200, 4500, 100, 300],
    lastAudit: '2025-11-25',
    status: 'Observacion',
  },
  {
    id: 3,
    name: 'Estacion Primax Centro',
    address: 'Guayaquil',
    lat: -2.1962,
    lng: -79.8862,
    stock: 2000,
    price: 2.55,
    officialPrice: 2.55,
    history: [0, 0, 0, 0, 0],
    lastAudit: '2025-11-30',
    status: 'Infraccion',
  },
  {
    id: 4,
    name: 'Estacion Andina Sur',
    address: 'Av. Loja, Cuenca',
    lat: -2.8974,
    lng: -79.0045,
    stock: 12000,
    price: 2.55,
    officialPrice: 2.55,
    history: [900, 880, 910, 930, 920],
    lastAudit: '2025-11-20',
    status: 'Cumplimiento',
  },
  {
    id: 5,
    name: 'Gasolinera Rio Verde',
    address: 'Esmeraldas',
    lat: 0.9529,
    lng: -79.6522,
    stock: 8000,
    price: 2.6,
    officialPrice: 2.55,
    history: [300, 320, 340, 310, 350],
    lastAudit: '2025-11-18',
    status: 'Observacion',
  },
  {
    id: 6,
    name: 'Estacion Sierra Norte',
    address: 'Ibarra',
    lat: 0.3392,
    lng: -78.1222,
    stock: 6000,
    price: 2.55,
    officialPrice: 2.55,
    history: [700, 680, 710, 690, 705],
    lastAudit: '2025-11-19',
    status: 'Cumplimiento',
  },
  {
    id: 7,
    name: 'PetroQ Oriente',
    address: 'Tena',
    lat: -0.9902,
    lng: -77.8129,
    stock: 22000,
    price: 2.52,
    officialPrice: 2.55,
    history: [1400, 1500, 1350, 1420, 1480],
    lastAudit: '2025-11-22',
    status: 'Cumplimiento',
  },
  {
    id: 8,
    name: 'Gasolinera Litoral',
    address: 'Manta',
    lat: -0.9677,
    lng: -80.7089,
    stock: 5000,
    price: 2.75,
    officialPrice: 2.55,
    history: [400, 390, 410, 395, 405],
    lastAudit: '2025-11-27',
    status: 'Infraccion',
  },
  {
    id: 9,
    name: 'Estacion Centro Sur',
    address: 'Ambato',
    lat: -1.2417,
    lng: -78.6197,
    stock: 9000,
    price: 2.55,
    officialPrice: 2.55,
    history: [0, 0, 0, 0, 0],
    lastAudit: '2025-11-21',
    status: 'Observacion',
  },
  {
    id: 10,
    name: 'Gasolinera Valle',
    address: 'Latacunga',
    lat: -0.9352,
    lng: -78.6155,
    stock: 11000,
    price: 2.55,
    officialPrice: 2.55,
    history: [1000, 1050, 980, 1200, 1150],
    lastAudit: '2025-11-23',
    status: 'Cumplimiento',
  },
  {
    id: 11,
    name: 'Estacion Frontera',
    address: 'Tulcan',
    lat: 0.8224,
    lng: -77.7329,
    stock: 3000,
    price: 2.9,
    officialPrice: 2.55,
    history: [200, 210, 190, 205, 215],
    lastAudit: '2025-11-26',
    status: 'Infraccion',
  },
  {
    id: 12,
    name: 'Estacion Pacifico',
    address: 'Salinas',
    lat: -2.2149,
    lng: -80.9524,
    stock: 7000,
    price: 2.55,
    officialPrice: 2.55,
    history: [650, 600, 700, 620, 680],
    lastAudit: '2025-11-24',
    status: 'Cumplimiento',
  },
];

const seedAudits = [
  {
    stationId: 1,
    code: 'AUD-2025-156',
    status: 'pending',
    priceExpected: 2.55,
    priceReported: 2.55,
    dispenserOk: 1,
    createdAt: '2025-12-01T10:20:00.000Z',
  },
  {
    stationId: 2,
    code: 'AUD-2025-162',
    status: 'approved',
    priceExpected: 2.55,
    priceReported: 2.58,
    dispenserOk: 0,
    createdAt: '2025-12-02T15:10:00.000Z',
  },
  {
    stationId: 3,
    code: 'AUD-2025-170',
    status: 'pending',
    priceExpected: 2.55,
    priceReported: 2.55,
    dispenserOk: 1,
    createdAt: '2025-12-03T09:00:00.000Z',
  },
  {
    stationId: 4,
    code: 'AUD-2025-175',
    status: 'pending',
    priceExpected: 2.55,
    priceReported: 2.55,
    dispenserOk: 1,
    createdAt: '2025-12-04T09:30:00.000Z',
  },
  {
    stationId: 5,
    code: 'AUD-2025-181',
    status: 'rejected',
    priceExpected: 2.55,
    priceReported: 2.62,
    dispenserOk: 0,
    createdAt: '2025-12-05T11:00:00.000Z',
  },
  {
    stationId: 6,
    code: 'AUD-2025-189',
    status: 'approved',
    priceExpected: 2.55,
    priceReported: 2.55,
    dispenserOk: 1,
    createdAt: '2025-12-06T10:15:00.000Z',
  },
  {
    stationId: 8,
    code: 'AUD-2025-192',
    status: 'pending',
    priceExpected: 2.55,
    priceReported: 2.75,
    dispenserOk: 0,
    createdAt: '2025-12-07T14:40:00.000Z',
  },
  {
    stationId: 11,
    code: 'AUD-2025-195',
    status: 'pending',
    priceExpected: 2.55,
    priceReported: 2.9,
    dispenserOk: 0,
    createdAt: '2025-12-08T08:10:00.000Z',
  },
];

const seedComplaints = [
  {
    stationName: 'Gasolinera El Oro',
    stationId: 2,
    type: 'Precios irregulares',
    detail: 'El precio marcado no coincide con el publicado.',
    source: 'cliente',
    reporterName: 'Maria V.',
    reporterRole: 'cliente',
    status: 'pending',
    createdAt: '2025-12-02T12:00:00.000Z',
  },
  {
    stationName: 'Estacion Primax Centro',
    stationId: 3,
    type: 'Falta de stock',
    detail: 'No se despacha combustible en horas pico.',
    source: 'cliente',
    reporterName: 'Carlos D.',
    reporterRole: 'cliente',
    status: 'resolved',
    resolvedAt: '2025-12-02T18:10:00.000Z',
    resolutionNote: 'Se coordino reabastecimiento.',
    createdAt: '2025-12-01T08:30:00.000Z',
  },
  {
    stationName: 'Estacion Andina Sur',
    stationId: 4,
    type: 'Dispensador defectuoso',
    detail: 'El dispensador 2 marca menos de lo entregado.',
    source: 'despachador',
    reporterName: 'Luis P.',
    reporterRole: 'despachador',
    status: 'pending',
    createdAt: '2025-12-04T16:45:00.000Z',
  },
  {
    stationName: 'Gasolinera Litoral',
    stationId: 8,
    type: 'Precio fuera de rango',
    detail: 'Precio reportado superior al oficial.',
    source: 'sistema',
    reporterRole: 'sistema',
    status: 'pending',
    createdAt: '2025-12-05T09:15:00.000Z',
  },
  {
    stationName: 'Estacion Frontera',
    stationId: 11,
    type: 'Consumo inusual',
    detail: 'Carga fuera de rango para el vehiculo.',
    source: 'cliente',
    reporterName: 'Andrea G.',
    reporterRole: 'cliente',
    vehiclePlate: 'PBA-1024',
    vehicleModel: 'Toyota Hilux 2019',
    fuelType: 'Diesel',
    liters: 180,
    unitPrice: 2.6,
    totalAmount: 468,
    occurredAt: '2025-12-06T21:50:00.000Z',
    status: 'pending',
    createdAt: '2025-12-06T22:10:00.000Z',
  },
];

const seedReports = [
  { period: 'Mes', format: 'PDF', createdAt: '2025-11-30T18:00:00.000Z', sizeMb: 2.4 },
  { period: 'Semana', format: 'CSV', createdAt: '2025-12-02T18:00:00.000Z', sizeMb: 1.1 },
  { period: 'Mes', format: 'Excel', createdAt: '2025-12-03T18:00:00.000Z', sizeMb: 3.2 },
  { period: 'Semana', format: 'PDF', createdAt: '2025-12-07T18:00:00.000Z', sizeMb: 1.6 },
  { period: 'Anio', format: 'CSV', createdAt: '2025-12-08T18:00:00.000Z', sizeMb: 4.2 },
];

const createTablesSql = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS session (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    stock INTEGER NOT NULL,
    price REAL NOT NULL,
    officialPrice REAL NOT NULL,
    history TEXT NOT NULL,
    lastAudit TEXT,
    status TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS audits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stationId INTEGER NOT NULL,
    code TEXT NOT NULL,
    status TEXT NOT NULL,
    priceExpected REAL NOT NULL,
    priceReported REAL NOT NULL,
    dispenserOk INTEGER NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (stationId) REFERENCES stations(id)
  );
  CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stationName TEXT NOT NULL,
    stationId INTEGER,
    type TEXT NOT NULL,
    detail TEXT,
    source TEXT,
    reporterName TEXT,
    reporterRole TEXT,
    vehiclePlate TEXT,
    vehicleModel TEXT,
    fuelType TEXT,
    liters REAL,
    unitPrice REAL,
    totalAmount REAL,
    occurredAt TEXT,
    photoUri TEXT,
    status TEXT NOT NULL,
    resolvedAt TEXT,
    resolutionNote TEXT,
    createdAt TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period TEXT NOT NULL,
    format TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    sizeMb REAL NOT NULL,
    fileUri TEXT,
    mimeType TEXT
  );
`;

const ensureColumn = async (
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  definition: string
): Promise<void> => {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table});`);
  const exists = (rows ?? []).some((row) => row.name === column);
  if (!exists) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
  }
};

export const initDatabase = async (): Promise<void> => {
  const db = await getDb();
  await db.execAsync('PRAGMA journal_mode = WAL;');

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = versionRow?.user_version ?? 0;
  const seedData = async () => {
    const userCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM users;');
    if ((userCount?.count ?? 0) === 0) {
      await db.runAsync(
        'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?);',
        'admin',
        'admin123',
        'Admin',
        'supervisor'
      );
    }

    const stationRows = await db.getAllAsync<{ name: string }>('SELECT name FROM stations;');
    const stationNames = new Set((stationRows ?? []).map((row) => row.name));
    for (const station of seedStations) {
      if (!stationNames.has(station.name)) {
        await db.runAsync(
          'INSERT INTO stations (id, name, address, lat, lng, stock, price, officialPrice, history, lastAudit, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
          station.id,
          station.name,
          station.address,
          station.lat,
          station.lng,
          station.stock,
          station.price,
          station.officialPrice,
          JSON.stringify(station.history),
          station.lastAudit,
          station.status
        );
      }
    }

    const auditRows = await db.getAllAsync<{ code: string }>('SELECT code FROM audits;');
    const auditCodes = new Set((auditRows ?? []).map((row) => row.code));
    for (const audit of seedAudits) {
      if (!auditCodes.has(audit.code)) {
        await db.runAsync(
          'INSERT INTO audits (stationId, code, status, priceExpected, priceReported, dispenserOk, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?);',
          audit.stationId,
          audit.code,
          audit.status,
          audit.priceExpected,
          audit.priceReported,
          audit.dispenserOk,
          audit.createdAt
        );
      }
    }

    const complaintRows = await db.getAllAsync<{ stationName: string; createdAt: string }>(
      'SELECT stationName, createdAt FROM complaints;'
    );
    const complaintKeys = new Set(
      (complaintRows ?? []).map((row) => `${row.stationName}|${row.createdAt}`)
    );
    for (const complaint of seedComplaints) {
      const key = `${complaint.stationName}|${complaint.createdAt}`;
      if (!complaintKeys.has(key)) {
        await db.runAsync(
          `INSERT INTO complaints (
             stationName, stationId, type, detail, source, reporterName, reporterRole,
             vehiclePlate, vehicleModel, fuelType, liters, unitPrice, totalAmount, occurredAt,
             photoUri, status, resolvedAt, resolutionNote, createdAt
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          complaint.stationName,
          complaint.stationId ?? null,
          complaint.type,
          complaint.detail ?? null,
          complaint.source ?? null,
          complaint.reporterName ?? null,
          complaint.reporterRole ?? null,
          complaint.vehiclePlate ?? null,
          complaint.vehicleModel ?? null,
          complaint.fuelType ?? null,
          complaint.liters ?? null,
          complaint.unitPrice ?? null,
          complaint.totalAmount ?? null,
          complaint.occurredAt ?? null,
          complaint.photoUri ?? null,
          complaint.status,
          complaint.resolvedAt ?? null,
          complaint.resolutionNote ?? null,
          complaint.createdAt
        );
      }
    }

    const reportRows = await db.getAllAsync<{ period: string; format: string; createdAt: string }>(
      'SELECT period, format, createdAt FROM reports;'
    );
    const reportKeys = new Set(
      (reportRows ?? []).map((row) => `${row.period}|${row.format}|${row.createdAt}`)
    );
    for (const report of seedReports) {
      const key = `${report.period}|${report.format}|${report.createdAt}`;
      if (!reportKeys.has(key)) {
        await db.runAsync(
          'INSERT INTO reports (period, format, createdAt, sizeMb) VALUES (?, ?, ?, ?);',
          report.period,
          report.format,
          report.createdAt,
          report.sizeMb
        );
      }
    }
  };

  if (currentVersion === 0) {
    await db.execAsync(createTablesSql);
    await seedData();

    await db.execAsync(`PRAGMA user_version = ${DB_VERSION};`);
    return;
  }

  if (currentVersion < 2) {
    await db.execAsync(createTablesSql);
    await ensureColumn(db, 'complaints', 'photoUri', 'TEXT');
    await ensureColumn(db, 'reports', 'fileUri', 'TEXT');
    await ensureColumn(db, 'reports', 'mimeType', 'TEXT');
    await db.execAsync('PRAGMA user_version = 2;');
  }

  if (currentVersion < 3) {
    await db.execAsync(createTablesSql);
    await seedData();
    await db.execAsync(`PRAGMA user_version = ${DB_VERSION};`);
  }

  if (currentVersion < 4) {
    await db.execAsync(createTablesSql);
    await ensureColumn(db, 'complaints', 'stationId', 'INTEGER');
    await ensureColumn(db, 'complaints', 'source', 'TEXT');
    await ensureColumn(db, 'complaints', 'reporterName', 'TEXT');
    await ensureColumn(db, 'complaints', 'reporterRole', 'TEXT');
    await ensureColumn(db, 'complaints', 'vehiclePlate', 'TEXT');
    await ensureColumn(db, 'complaints', 'vehicleModel', 'TEXT');
    await ensureColumn(db, 'complaints', 'fuelType', 'TEXT');
    await ensureColumn(db, 'complaints', 'liters', 'REAL');
    await ensureColumn(db, 'complaints', 'unitPrice', 'REAL');
    await ensureColumn(db, 'complaints', 'totalAmount', 'REAL');
    await ensureColumn(db, 'complaints', 'occurredAt', 'TEXT');
    await ensureColumn(db, 'complaints', 'resolvedAt', 'TEXT');
    await ensureColumn(db, 'complaints', 'resolutionNote', 'TEXT');
    await seedData();
    await db.execAsync(`PRAGMA user_version = ${DB_VERSION};`);
  }
};
