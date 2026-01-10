const DEFAULT_EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const PUSH_TOKEN_REGEX = /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/;

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export type ExpoPushResult = {
  token: string;
  status: 'ok' | 'error';
  message?: string;
  details?: unknown;
};

const chunkMessages = <T>(messages: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < messages.length; i += size) {
    chunks.push(messages.slice(i, i + size));
  }
  return chunks;
};

export const isValidExpoPushToken = (token: string): boolean => {
  return PUSH_TOKEN_REGEX.test(token);
};

export const sendExpoPushNotifications = async (options: {
  messages: ExpoPushMessage[];
  accessToken?: string;
  apiUrl?: string;
}): Promise<ExpoPushResult[]> => {
  const apiUrl = options.apiUrl ?? DEFAULT_EXPO_PUSH_URL;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const results: ExpoPushResult[] = [];
  const chunks = chunkMessages(options.messages, 100);

  for (const chunk of chunks) {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(chunk),
    });

    if (!response.ok) {
      const text = await response.text();
      const message = text || `HTTP ${response.status}`;
      for (const item of chunk) {
        results.push({ token: item.to, status: 'error', message });
      }
      continue;
    }

    const payload = (await response.json()) as { data?: Array<{ status?: string; message?: string; details?: unknown }> };
    const responseItems = payload?.data ?? [];

    for (let index = 0; index < chunk.length; index += 1) {
      const item = responseItems[index];
      if (item?.status === 'ok') {
        results.push({ token: chunk[index].to, status: 'ok' });
      } else {
        results.push({
          token: chunk[index].to,
          status: 'error',
          message: item?.message ?? 'Push delivery failed',
          details: item?.details,
        });
      }
    }
  }

  return results;
};
