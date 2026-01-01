export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim();
export const USE_REMOTE_AUTH = API_BASE_URL.length > 0;
