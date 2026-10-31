import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authenticate, generateToken } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email address or password',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email address or password',
      });
    }

    const authUser = {
      id: user.id,
      authorId: user.authorId,
      name: user.name,
      email: user.email,
      role: user.role as 'AUTHOR' | 'ADMIN',
    };

    const token = generateToken(authUser);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        authorId: user.authorId,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        city: user.city,
        joinedDate: user.joinedDate,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        authorId: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        city: true,
        joinedDate: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User account not found',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Convenience endpoint for testers to retrieve pre-seeded demo accounts
 */
router.get('/demo-accounts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { name: true, email: true, role: true },
    });

    const authors = await prisma.user.findMany({
      where: { role: 'AUTHOR' },
      select: { authorId: true, name: true, email: true, city: true },
      take: 10,
    });

    res.json({
      success: true,
      accounts: {
        adminDefaultPassword: 'admin123',
        authorDefaultPassword: 'author123',
        admins,
        authors,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
