import { USE_REMOTE_AUTH } from '../config/env';
import { buildApiUrl } from './ApiClient';
import { getDb } from './Database';
import { SecureSession } from './SecureSession';

export type SessionUser = {
  id: number;
  username: string;
  name: string;
  role: string;
};

export const AuthService = {
  login: async (username: string, password: string): Promise<SessionUser> => {
    if (USE_REMOTE_AUTH) {
      const response = await fetch(buildApiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      if (!data?.user) {
        throw new Error('Invalid response');
      }

      await SecureSession.save({ user: data.user, token: data.token });
      return data.user as SessionUser;
    }

    const db = await getDb();
    const user = await db.getFirstAsync<SessionUser>(
      'SELECT id, username, name, role FROM users WHERE username = ? AND password = ?;',
      username,
      password
    );

    if (!user) {
      throw new Error('Invalid credentials');
    }

    await db.runAsync('DELETE FROM session;');
    await db.runAsync(
      'INSERT INTO session (userId, createdAt) VALUES (?, ?);',
      user.id,
      new Date().toISOString()
    );

    await SecureSession.save({ user });
    return user;
  },

  getSession: async (): Promise<SessionUser | null> => {
    const stored = await SecureSession.get();
    if (stored?.user) {
      return stored.user as SessionUser;
    }
    if (USE_REMOTE_AUTH) {
      return null;
    }

    const db = await getDb();
    const session = await db.getFirstAsync<SessionUser>(
      `SELECT u.id, u.username, u.name, u.role
       FROM session s
       JOIN users u ON u.id = s.userId
       ORDER BY s.id DESC
       LIMIT 1;`
    );
    return session ?? null;
  },

  logout: async (): Promise<void> => {
    if (!USE_REMOTE_AUTH) {
      const db = await getDb();
      await db.runAsync('DELETE FROM session;');
    }
    await SecureSession.clear();
  },
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
      const session = await SecureSession.get();
      
      if (!session?.token) {
        throw new Error('No session');
      }
    
      const response = await fetch(buildApiUrl('/auth/change-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
    
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'Error changing password');
      }
    },
};
