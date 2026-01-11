import { z } from 'zod';

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
  EXPO_ACCESS_TOKEN: z.string().optional(),
  EXPO_PUSH_URL: z.string().url().optional(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
});

export const env = envSchema.parse(process.env);

export const NODE_ENV = env.NODE_ENV;
export const PORT = env.PORT;
export const HOST = env.HOST;
export const JWT_SECRET = env.JWT_SECRET;
export const JWT_ISSUER = env.JWT_ISSUER?.trim() || undefined;
export const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN;
export const PUBLIC_BASE_URL = (env.PUBLIC_BASE_URL ?? `http://localhost:${PORT}`).replace(/\/+$/, '');
export const FILES_BASE_URL = (env.FILES_BASE_URL ?? PUBLIC_BASE_URL).replace(/\/+$/, '');
export const CORS_ORIGIN = env.CORS_ORIGIN ?? '';
export const TRUST_PROXY = env.TRUST_PROXY === 'true' || env.TRUST_PROXY === '1';
export const RATE_LIMIT_MAX = env.RATE_LIMIT_MAX;
export const RATE_LIMIT_WINDOW = env.RATE_LIMIT_WINDOW;
export const EXPO_ACCESS_TOKEN = env.EXPO_ACCESS_TOKEN?.trim() || undefined;
export const EXPO_PUSH_URL = env.EXPO_PUSH_URL ?? 'https://exp.host/--/api/v2/push/send';
export const REDIS_URL = env.REDIS_URL;

if (NODE_ENV === 'production') {
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

export const parseOrigins = () => {
  const raw = CORS_ORIGIN.split(',').map((value) => value.trim()).filter(Boolean);
  if (raw.length === 0) {
    return NODE_ENV === 'production' ? false : true;
  }
  if (raw.includes('*')) {
    if (NODE_ENV === 'production') {
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
