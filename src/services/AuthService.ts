import { getDb } from './Database';

export type SessionUser = {
  id: number;
  username: string;
  name: string;
  role: string;
};

export const AuthService = {
  login: async (username: string, password: string): Promise<SessionUser> => {
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

    return user;
  },

  getSession: async (): Promise<SessionUser | null> => {
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
    const db = await getDb();
    await db.runAsync('DELETE FROM session;');
  },
};
