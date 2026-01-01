import * as SecureStore from 'expo-secure-store';

const USER_KEY = 'ecocombustible.user';
const TOKEN_KEY = 'ecocombustible.token';

export type StoredSession = {
  user: { id: number; username: string; name: string; role: string };
  token?: string;
};

export const SecureSession = {
  save: async (payload: StoredSession): Promise<void> => {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(payload.user));
    if (payload.token) {
      await SecureStore.setItemAsync(TOKEN_KEY, payload.token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  },

  get: async (): Promise<StoredSession | null> => {
    const userJson = await SecureStore.getItemAsync(USER_KEY);
    if (!userJson) {
      return null;
    }
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    return {
      user: JSON.parse(userJson),
      token: token ?? undefined,
    };
  },

  clear: async (): Promise<void> => {
    await SecureStore.deleteItemAsync(USER_KEY);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};
