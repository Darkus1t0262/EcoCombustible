import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: number; username: string; name: string; role: string };
    user: { id: number; username: string; name: string; role: string };
  }
}
