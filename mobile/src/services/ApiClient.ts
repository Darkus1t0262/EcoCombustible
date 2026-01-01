import { API_BASE_URL, USE_REMOTE_AUTH } from '../config/env';
import { SecureSession } from './SecureSession';

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
};

export const buildApiUrl = (path: string) => {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

export const getAuthHeaders = async () => {
  const session = await SecureSession.get();
  const headers: Record<string, string> = {};
  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }
  return headers;
};

export const apiFetch = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  if (!USE_REMOTE_AUTH) {
    throw new Error('API base URL not configured.');
  }

  const session = await SecureSession.get();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers ?? {}),
  };

  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  const response = await fetch(buildApiUrl(path), {
    method: options.method ?? 'GET',
    headers,
    body: options.body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Request failed');
  }

  return (await response.json()) as T;
};
