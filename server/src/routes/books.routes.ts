import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Protect all book endpoints
router.use(authenticate);

/**
 * GET /api/books
 * If author: returns only their books.
 * If admin: returns all books or filtered by authorId.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAuthor = req.user!.role === 'AUTHOR';
    const authorFilter = isAuthor
      ? { authorId: req.user!.id }
      : req.query.authorId
      ? { authorId: String(req.query.authorId) }
      : {};

    const books = await prisma.book.findMany({
      where: authorFilter,
      include: {
        author: {
          select: {
            id: true,
            authorId: true,
            name: true,
            email: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedBooks = books.map((b) => ({
      ...b,
      availableOn: typeof b.availableOn === 'string' ? JSON.parse(b.availableOn || '[]') : b.availableOn,
    }));

    // Author royalty summary rollups
    const summary = formattedBooks.reduce(
      (acc, b) => {
        acc.totalBooks += 1;
        acc.totalCopiesSold += b.totalCopiesSold || 0;
        acc.totalRoyaltyEarned += b.totalRoyaltyEarned || 0;
        acc.totalRoyaltyPaid += b.royaltyPaid || 0;
        acc.totalRoyaltyPending += b.royaltyPending || 0;
        return acc;
      },
      {
        totalBooks: 0,
        totalCopiesSold: 0,
        totalRoyaltyEarned: 0,
        totalRoyaltyPaid: 0,
        totalRoyaltyPending: 0,
      }
    );

    res.json({
      success: true,
      summary,
      books: formattedBooks,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/books/:id
 * Retrieve specific book details.
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookId = String(req.params.id);
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        author: {
          select: {
            id: true,
            authorId: true,
            name: true,
            email: true,
            city: true,
            phone: true,
          },
        },
      },
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        error: `Book with ID '${bookId}' was not found`,
      });
    }

    // Role-based authorization check
    if (req.user!.role === 'AUTHOR' && book.authorId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view books registered under your own author account.',
      });
    }

    res.json({
      success: true,
      book: {
        ...book,
        availableOn: typeof book.availableOn === 'string' ? JSON.parse(book.availableOn || '[]') : book.availableOn,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
