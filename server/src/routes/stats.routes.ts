import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);
router.use(requireRole('ADMIN'));

/**
 * GET /api/stats/dashboard
 * Aggregated operational metrics for BookLeaf operations leadership
 */
router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalTickets = await prisma.ticket.count();
    const openTickets = await prisma.ticket.count({ where: { status: 'Open' } });
    const inProgressTickets = await prisma.ticket.count({ where: { status: 'In Progress' } });
    const resolvedTickets = await prisma.ticket.count({ where: { status: 'Resolved' } });
    const closedTickets = await prisma.ticket.count({ where: { status: 'Closed' } });

    const criticalTickets = await prisma.ticket.count({
      where: {
        priority: 'Critical',
        status: { in: ['Open', 'In Progress'] },
      },
    });

    const highTickets = await prisma.ticket.count({
      where: {
        priority: 'High',
        status: { in: ['Open', 'In Progress'] },
      },
    });

    // Unresolved tickets older than 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const urgentOldTicketsCount = await prisma.ticket.count({
      where: {
        status: { in: ['Open', 'In Progress'] },
        createdAt: { lt: oneDayAgo },
      },
    });

    // Grouping by category
    const categoryGroup = await prisma.ticket.groupBy({
      by: ['category'],
      _count: { id: true },
    });

    const totalAuthors = await prisma.user.count({ where: { role: 'AUTHOR' } });
    const totalBooks = await prisma.book.count();

    res.json({
      success: true,
      metrics: {
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
        criticalTickets,
        highTickets,
        urgentOldTicketsCount,
        totalAuthors,
        totalBooks,
        byCategory: categoryGroup.map((c) => ({
          category: c.category,
          count: c._count.id,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
