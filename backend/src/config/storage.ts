import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

export const STORAGE_DIR = path.resolve(process.cwd(), 'storage');
export const REPORTS_DIR = path.join(STORAGE_DIR, 'reports');
export const COMPLAINTS_DIR = path.join(STORAGE_DIR, 'complaints');

const ensureDir = (dir: string) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
};

export const ensureStorageDirs = () => {
  ensureDir(STORAGE_DIR);
  ensureDir(REPORTS_DIR);
  ensureDir(COMPLAINTS_DIR);
};

export const safeFilename = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

export const estimateSizeMb = (sizeBytes: number) => Number((sizeBytes / (1024 * 1024)).toFixed(2));
