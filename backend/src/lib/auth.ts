import { prisma } from './prisma.js';

export const authenticate = async (request: any, reply: any) => {
  try {
    await request.jwtVerify();
  } catch (error) {
    reply.code(401).send({ error: 'Unauthorized' });
    return;
  }

  const userId = (request.user as { id?: number } | undefined)?.id;
  if (!userId) {
    reply.code(401).send({ error: 'Unauthorized' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.active) {
    reply.code(403).send({ error: 'Account disabled' });
    return;
  }

  request.user = {
    ...(request.user ?? {}),
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    active: user.active,
  };
};

export const requireRole = (role: string) => async (request: any, reply: any) => {
  const user = request.user as { role?: string } | undefined;
  if (!user?.role) {
    reply.code(403).send({ error: 'Forbidden' });
    return;
  }
  if (user.role !== role && user.role !== 'admin') {
    reply.code(403).send({ error: 'Forbidden' });
    return;
  }
};
