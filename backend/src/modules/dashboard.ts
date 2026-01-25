import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../lib/auth.js';

export const registerDashboardRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/dashboard', { preHandler: [authenticate] }, async () => {
    const stations = await prisma.station.count();
    const auditsTotal = await prisma.audit.count();
    const pendingAudits = await prisma.audit.count({ where: { status: 'pending' } });
    const pendingComplaints = await prisma.complaint.count({ where: { status: 'pending' } });
    return { stations, auditsTotal, pendingAudits, pendingComplaints };
  });
};
