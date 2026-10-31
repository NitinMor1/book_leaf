export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'BookLeaf Publishing - Author Support & Communication Portal API',
    version: '1.0.0',
    description: `
REST API powering the BookLeaf Author Support & Communication Portal.
Includes Author & Admin authentication, catalog & royalty management, AI-assisted ticket triage, auto-classification, priority scoring, knowledge-base-grounded response drafts, and real-time Socket.io updates.
    `,
    contact: {
      name: 'BookLeaf Publishing Technical Team',
      url: 'https://www.bookleafpub.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from /api/auth/login',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Error message description' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'subject' },
                message: { type: 'string', example: 'Subject must be at least 5 characters long' },
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          authorId: { type: 'string', example: 'AUTH001' },
          name: { type: 'string', example: 'Priya Sharma' },
          email: { type: 'string', example: 'priya.sharma@email.com' },
          role: { type: 'string', enum: ['AUTHOR', 'ADMIN'] },
          phone: { type: 'string', example: '+91-98765-43210' },
          city: { type: 'string', example: 'Mumbai' },
          joinedDate: { type: 'string', format: 'date-time' },
        },
      },
      Book: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'BK001' },
          title: { type: 'string', example: 'Whispers of the Ganges' },
          isbn: { type: 'string', example: '978-93-5XXXX-01-1' },
          genre: { type: 'string', example: 'Literary Fiction' },
          publicationDate: { type: 'string', format: 'date-time', nullable: true },
          status: { type: 'string', example: 'Published & Live' },
          mrp: { type: 'number', example: 399, nullable: true },
          authorRoyaltyPerCopy: { type: 'number', example: 35, nullable: true },
          totalCopiesSold: { type: 'integer', example: 342 },
          totalRoyaltyEarned: { type: 'number', example: 11970 },
          royaltyPaid: { type: 'number', example: 8400 },
          royaltyPending: { type: 'number', example: 3570 },
          lastRoyaltyPayoutDate: { type: 'string', format: 'date-time', nullable: true },
          printPartner: { type: 'string', example: 'In-House' },
          availableOn: {
            type: 'array',
            items: { type: 'string' },
            example: ['Amazon India', 'Flipkart', 'BookLeaf Store'],
          },
        },
      },
      Ticket: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          ticketNumber: { type: 'integer', example: 1001 },
          authorId: { type: 'string' },
          bookId: { type: 'string', nullable: true },
          subject: { type: 'string', example: 'Pending royalty payout question' },
          description: { type: 'string', example: 'When will my Q3 royalty be disbursed?' },
          category: {
            type: 'string',
            enum: [
              'Royalty & Payments',
              'ISBN & Metadata Issues',
              'Printing & Quality',
              'Distribution & Availability',
              'Book Status & Production Updates',
              'General Inquiry',
            ],
          },
          aiCategory: { type: 'string' },
          isCategoryOverridden: { type: 'boolean' },
          priority: {
            type: 'string',
            enum: ['Critical', 'High', 'Medium', 'Low'],
          },
          aiPriority: { type: 'string' },
          isPriorityOverridden: { type: 'boolean' },
          status: {
            type: 'string',
            enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
          },
          assignedToId: { type: 'string', nullable: true },
          aiDraftResponse: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Log in with email and password',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'priya.sharma@email.com' },
                  password: { type: 'string', example: 'author123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Authentication successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    token: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current authenticated user profile',
        responses: {
          200: {
            description: 'Current user profile',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/demo-accounts': {
      get: {
        tags: ['Authentication'],
        summary: 'List pre-seeded demo author and admin credentials for testing',
        security: [],
        responses: {
          200: {
            description: 'Demo credentials and account list',
          },
        },
      },
    },
    '/api/books': {
      get: {
        tags: ['Books & Catalog'],
        summary: 'List books (Author sees own catalog with royalty rollup; Admin can view all)',
        parameters: [
          {
            name: 'authorId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter books by author ID (Admin only)',
          },
        ],
        responses: {
          200: {
            description: 'Books list and royalty summary',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    summary: {
                      type: 'object',
                      properties: {
                        totalBooks: { type: 'integer' },
                        totalCopiesSold: { type: 'integer' },
                        totalRoyaltyEarned: { type: 'number' },
                        totalRoyaltyPaid: { type: 'number' },
                        totalRoyaltyPending: { type: 'number' },
                      },
                    },
                    books: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Book' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/tickets': {
      get: {
        tags: ['Tickets & Support'],
        summary: 'Fetch tickets (Authors view own tickets; Admins view all with queue filters)',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'priority', in: 'query', schema: { type: 'string' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['newest', 'oldest', 'oldest_unresolved', 'priority'] } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Filtered ticket queue',
          },
        },
      },
      post: {
        tags: ['Tickets & Support'],
        summary: 'Submit a new author support ticket (Triggers AI auto-classification, priority scoring & draft generation)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['subject', 'description'],
                properties: {
                  bookId: { type: 'string', nullable: true, example: 'BK001' },
                  subject: { type: 'string', example: 'Query regarding missing Amazon UK listing' },
                  description: { type: 'string', example: 'I noticed my book is unavailable on Amazon UK. Could you check the distribution sync?' },
                  attachmentName: { type: 'string', nullable: true, example: 'screenshot_amazon_uk.png' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Ticket successfully created with AI classification and draft response',
          },
        },
      },
    },
    '/api/tickets/{id}': {
      get: {
        tags: ['Tickets & Support'],
        summary: 'Get ticket details and message thread (Admins see internal notes; authors see public thread only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Ticket thread and details' },
          403: { description: 'Unauthorized access to another author ticket' },
          404: { description: 'Ticket not found' },
        },
      },
      patch: {
        tags: ['Tickets & Support'],
        summary: 'Update ticket status, override AI category, override AI priority, or assign ticket (Admin only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['Open', 'In Progress', 'Resolved', 'Closed'] },
                  category: { type: 'string' },
                  priority: { type: 'string', enum: ['Critical', 'High', 'Medium', 'Low'] },
                  assignedToId: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Ticket updated successfully' },
        },
      },
    },
    '/api/tickets/{id}/messages': {
      post: {
        tags: ['Tickets & Support'],
        summary: 'Post a message/reply to ticket (Broadcasts in real-time via WebSockets)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', example: 'Thank you for following up. The stock has been re-synced.' },
                  isInternal: { type: 'boolean', example: false, description: 'True for internal admin note invisible to authors' },
                  updateStatus: { type: 'string', enum: ['Open', 'In Progress', 'Resolved', 'Closed'], nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Message sent and broadcasted' },
        },
      },
    },
    '/api/tickets/{id}/regenerate-draft': {
      post: {
        tags: ['AI Integration'],
        summary: 'Regenerate AI draft response on demand (Admin only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Fresh AI response generated' },
        },
      },
    },
    '/api/stats/dashboard': {
      get: {
        tags: ['Dashboard & Analytics'],
        summary: 'Get aggregated operations metrics (Admin only)',
        responses: {
          200: { description: 'Admin statistics' },
        },
      },
    },
    '/api/authors': {
      get: {
        tags: ['Authors'],
        summary: 'List all registered authors and their performance metrics (Admin only)',
        responses: {
          200: { description: 'Author directory' },
        },
      },
    },
  },
};
