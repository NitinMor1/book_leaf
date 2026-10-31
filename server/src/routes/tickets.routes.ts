import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { classifyAndScoreTicket, generateDraftResponse } from '../services/aiService.js';
import { emitNewTicket, emitTicketUpdate, emitNewMessage } from '../services/socketService.js';
import { CATEGORIES, PRIORITIES, STATUSES, TicketCategoryType } from '../config/kb.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

const createTicketSchema = z.object({
  bookId: z.string().nullable().optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters long'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  attachmentName: z.string().nullable().optional(),
});

const updateTicketSchema = z.object({
  status: z.enum(STATUSES as unknown as [string, ...string[]]).optional(),
  category: z.enum(CATEGORIES as unknown as [string, ...string[]]).optional(),
  priority: z.enum(PRIORITIES as unknown as [string, ...string[]]).optional(),
  assignedToId: z.string().nullable().optional(),
});

const createMessageSchema = z.object({
  message: z.string().min(1, 'Message body cannot be empty'),
  isInternal: z.boolean().optional().default(false),
  updateStatus: z.enum(STATUSES as unknown as [string, ...string[]]).optional(),
});

/**
 * GET /api/tickets
 * Author: returns their own submitted tickets.
 * Admin: returns all tickets, filterable by status, category, priority, and sortable.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAuthor = req.user!.role === 'AUTHOR';
    const { status, category, priority, sortBy, search } = req.query;

    const whereClause: any = {};

    if (isAuthor) {
      whereClause.authorId = req.user!.id;
    } else {
      if (status && status !== 'ALL') whereClause.status = String(status);
      if (category && category !== 'ALL') whereClause.category = String(category);
      if (priority && priority !== 'ALL') whereClause.priority = String(priority);
      if (search) {
        whereClause.OR = [
          { subject: { contains: String(search) } },
          { description: { contains: String(search) } },
          { author: { name: { contains: String(search) } } },
          { author: { email: { contains: String(search) } } },
          { book: { title: { contains: String(search) } } },
        ];
      }
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'oldest_unresolved') {
      orderBy = [
        { status: 'asc' },
        { createdAt: 'asc' },
      ];
    } else if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' };
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
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
        book: {
          select: {
            id: true,
            title: true,
            isbn: true,
            status: true,
            royaltyPending: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            messages: isAuthor ? { where: { isInternal: false } } : true,
          },
        },
      },
      orderBy,
    });

    if (sortBy === 'priority') {
      const priorityWeights: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      tickets.sort((a, b) => (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0));
    }

    res.json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tickets
 * Author creates a ticket.
 * Automatically runs AI auto-classification, priority scoring, and pre-generates AI draft response!
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookId, subject, description, attachmentName } = createTicketSchema.parse(req.body);

    const author = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!author) {
      return res.status(404).json({ success: false, error: 'Author account not found' });
    }

    let book: any = null;
    if (bookId) {
      book = await prisma.book.findUnique({
        where: { id: bookId },
      });
      if (book && book.authorId !== author.id && req.user!.role === 'AUTHOR') {
        return res.status(403).json({
          success: false,
          error: 'Invalid book selected for this author account.',
        });
      }
    }

    // AI Auto-Classification & Priority Scoring
    const aiTriage = await classifyAndScoreTicket(
      subject,
      description,
      { name: author.name, email: author.email, city: author.city },
      book
    );

    // AI-Drafted Response based on Knowledge Base & Query context
    const aiDraft = await generateDraftResponse(
      aiTriage.category,
      subject,
      description,
      { name: author.name, email: author.email, city: author.city },
      book
    );

    const lastTicket = await prisma.ticket.findFirst({
      orderBy: { ticketNumber: 'desc' },
      select: { ticketNumber: true },
    });
    const nextTicketNumber = (lastTicket?.ticketNumber || 1000) + 1;

    const newTicket = await prisma.ticket.create({
      data: {
        ticketNumber: nextTicketNumber,
        authorId: author.id,
        bookId: book ? book.id : null,
        subject,
        description,
        attachmentName: attachmentName || null,
        category: aiTriage.category,
        aiCategory: aiTriage.category,
        isCategoryOverridden: false,
        priority: aiTriage.priority,
        aiPriority: aiTriage.priority,
        status: 'Open',
        aiDraftResponse: aiDraft,
      },
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
        book: {
          select: {
            id: true,
            title: true,
            isbn: true,
            status: true,
            royaltyPending: true,
          },
        },
      },
    });

    emitNewTicket(newTicket);

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully',
      ticket: newTicket,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/tickets/:id
 * Retrieve single ticket details with complete message thread.
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAuthor = req.user!.role === 'AUTHOR';
    const ticketId = String(req.params.id);

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        author: {
          select: {
            id: true,
            authorId: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            joinedDate: true,
          },
        },
        book: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          where: isAuthor ? { isInternal: false } : {},
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: `Ticket with ID '${ticketId}' was not found.`,
      });
    }

    if (isAuthor && ticket.authorId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view your own support tickets.',
      });
    }

    const formattedBook = ticket.book
      ? {
          ...ticket.book,
          availableOn: typeof ticket.book.availableOn === 'string' ? JSON.parse(ticket.book.availableOn || '[]') : ticket.book.availableOn,
        }
      : null;

    res.json({
      success: true,
      ticket: {
        ...ticket,
        book: formattedBook,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/tickets/:id
 * Admin updates ticket status, overrides category, overrides priority, or assigns ticket.
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only BookLeaf administrators can manage ticket properties.',
      });
    }

    const ticketId = String(req.params.id);
    const { status, category, priority, assignedToId } = updateTicketSchema.parse(req.body);

    const existingTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!existingTicket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    const updateData: any = {};

    if (status) updateData.status = status;

    if (category && category !== existingTicket.category) {
      updateData.category = category;
      if (category !== existingTicket.aiCategory) {
        updateData.isCategoryOverridden = true;
      }
    }

    if (priority && priority !== existingTicket.priority) {
      updateData.priority = priority;
      if (priority !== existingTicket.aiPriority) {
        updateData.isPriorityOverridden = true;
      }
    }

    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
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
        book: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    emitTicketUpdate(updatedTicket.id, updatedTicket.authorId, updatedTicket);

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      ticket: updatedTicket,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tickets/:id/regenerate-draft
 * Admin requests a fresh AI draft response.
 */
router.post('/:id/regenerate-draft', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Only admins can regenerate AI drafts.' });
    }

    const ticketId = String(req.params.id);
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        author: true,
        book: true,
      },
    });

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    const freshDraft = await generateDraftResponse(
      ticket.category as TicketCategoryType,
      ticket.subject,
      ticket.description,
      { name: ticket.author.name, email: ticket.author.email, city: ticket.author.city },
      ticket.book
    );

    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { aiDraftResponse: freshDraft },
    });

    res.json({
      success: true,
      message: 'AI draft response regenerated successfully',
      aiDraftResponse: updated.aiDraftResponse,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tickets/:id/messages
 * Post a reply to the ticket thread.
 */
router.post('/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticketId = String(req.params.id);
    const { message, isInternal, updateStatus } = createMessageSchema.parse(req.body);

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    if (req.user!.role === 'AUTHOR' && ticket.authorId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only reply to your own tickets.',
      });
    }

    const actualIsInternal = req.user!.role === 'ADMIN' ? Boolean(isInternal) : false;

    const newMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: req.user!.id,
        senderName: req.user!.name,
        senderRole: req.user!.role,
        message,
        isInternal: actualIsInternal,
      },
    });

    let updatedTicket = ticket;
    if (req.user!.role === 'ADMIN') {
      const newStatus = updateStatus || (ticket.status === 'Open' ? 'In Progress' : undefined);
      if (newStatus && newStatus !== ticket.status) {
        updatedTicket = await prisma.ticket.update({
          where: { id: ticket.id },
          data: { status: newStatus },
        });
        emitTicketUpdate(ticket.id, ticket.authorId, updatedTicket);
      }
    }

    emitNewMessage(ticket.id, ticket.authorId, newMessage);

    res.status(201).json({
      success: true,
      message: actualIsInternal ? 'Internal note added' : 'Message sent successfully',
      ticketMessage: newMessage,
      ticketStatus: updatedTicket.status,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
