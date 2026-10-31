import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

/**
 * GET /api/authors
 * Admin view of authors and their aggregate performance
 */
router.get('/', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authors = await prisma.user.findMany({
      where: { role: 'AUTHOR' },
      select: {
        id: true,
        authorId: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        joinedDate: true,
        _count: {
          select: {
            books: true,
            tickets: true,
          },
        },
        books: {
          select: {
            id: true,
            title: true,
            status: true,
            royaltyPending: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      count: authors.length,
      authors,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/authors/:id
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetId = String(req.params.id);

    if (req.user!.role === 'AUTHOR' && req.user!.id !== targetId) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    const author = await prisma.user.findUnique({
      where: { id: targetId },
      include: {
        books: true,
        tickets: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!author) {
      return res.status(404).json({ success: false, error: 'Author not found' });
    }

    res.json({
      success: true,
      author: {
        id: author.id,
        authorId: author.authorId,
        name: author.name,
        email: author.email,
        phone: author.phone,
        city: author.city,
        joinedDate: author.joinedDate,
        books: author.books.map((b: any) => ({
          ...b,
          availableOn: typeof b.availableOn === 'string' ? JSON.parse(b.availableOn || '[]') : b.availableOn,
        })),
        tickets: author.tickets,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
