import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../lib/auth.js';

export const registerDashboardRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/dashboard', { preHandler: [authenticate] }, async () => {
    const stations = await prisma.station.count();
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const auditsThisMonth = await prisma.audit.count({ where: { createdAt: { gte: start } } });
    const pendingComplaints = await prisma.complaint.count({ where: { status: 'pending' } });
    return { stations, auditsThisMonth, pendingComplaints };
  });
};
