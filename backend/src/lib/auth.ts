export const authenticate = async (request: any, reply: any) => {
  try {
    await request.jwtVerify();
  } catch (error) {
    reply.code(401).send({ error: 'Unauthorized' });
    return;
  }
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
