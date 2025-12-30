import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
const DB_NAME = 'ecocombustible.db';
const DB_VERSION = 1;

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
];

const seedComplaints = [
  {
    stationName: 'Gasolinera El Oro',
    type: 'Precios irregulares',
    detail: 'El precio marcado no coincide con el publicado.',
    status: 'pending',
    createdAt: '2025-12-02T12:00:00.000Z',
  },
  {
    stationName: 'Estacion Primax Centro',
    type: 'Falta de stock',
    detail: 'No se despacha combustible en horas pico.',
    status: 'resolved',
    createdAt: '2025-12-01T08:30:00.000Z',
  },
];

const seedReports = [
  { period: 'Mes', format: 'PDF', createdAt: '2025-11-30T18:00:00.000Z', sizeMb: 2.4 },
  { period: 'Semana', format: 'CSV', createdAt: '2025-12-02T18:00:00.000Z', sizeMb: 1.1 },
  { period: 'Mes', format: 'Excel', createdAt: '2025-12-03T18:00:00.000Z', sizeMb: 3.2 },
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
    type TEXT NOT NULL,
    detail TEXT,
    status TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period TEXT NOT NULL,
    format TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    sizeMb REAL NOT NULL
  );
`;

export const initDatabase = async (): Promise<void> => {
  const db = await getDb();
  await db.execAsync('PRAGMA journal_mode = WAL;');

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = versionRow?.user_version ?? 0;
  if (currentVersion >= DB_VERSION) {
    return;
  }

  await db.execAsync(createTablesSql);

  const userCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM users;');
  if ((userCount?.count ?? 0) === 0) {
    await db.runAsync(
      'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?);',
      'admin',
      'admin123',
      'Admin',
      'supervisor'
    );

    for (const station of seedStations) {
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

    for (const audit of seedAudits) {
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

    for (const complaint of seedComplaints) {
      await db.runAsync(
        'INSERT INTO complaints (stationName, type, detail, status, createdAt) VALUES (?, ?, ?, ?, ?);',
        complaint.stationName,
        complaint.type,
        complaint.detail,
        complaint.status,
        complaint.createdAt
      );
    }

    for (const report of seedReports) {
      await db.runAsync(
        'INSERT INTO reports (period, format, createdAt, sizeMb) VALUES (?, ?, ?, ?);',
        report.period,
        report.format,
        report.createdAt,
        report.sizeMb
      );
    }
  }

  await db.execAsync(`PRAGMA user_version = ${DB_VERSION};`);
};
