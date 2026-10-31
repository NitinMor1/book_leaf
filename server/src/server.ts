import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';

import { initSocketIO } from './services/socketService.js';
import { errorHandler } from './middleware/errorHandler.js';
import { swaggerSpec } from './utils/swagger.js';

import authRoutes from './routes/auth.routes.js';
import bookRoutes from './routes/books.routes.js';
import ticketRoutes from './routes/tickets.routes.js';
import authorRoutes from './routes/authors.routes.js';
import statsRoutes from './routes/stats.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocketIO(server);

// Middleware
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'BookLeaf Author Support Portal API',
    timestamp: new Date().toISOString(),
    aiEngine: process.env.GEMINI_API_KEY ? 'Gemini 1.5 Flash (Active)' : 'BookLeaf Heuristic Knowledge Engine (Active)',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/stats', statsRoutes);

// Serve static frontend in production if built
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // If client is not built yet, return friendly message
      res.status(200).send(`
        <h1>BookLeaf Support Portal Backend API</h1>
        <p>Backend API is active.</p>
        <p>Explore the interactive API Documentation at: <a href="/api/docs">/api/docs</a></p>
      `);
    }
  });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 BookLeaf Server listening on http://localhost:${PORT}`);
  console.log(`📚 Swagger API Docs available at http://localhost:${PORT}/api/docs`);
  console.log(`🤖 AI Engine: ${process.env.GEMINI_API_KEY ? 'Gemini 1.5 Flash' : 'Knowledge Base Heuristic'}`);
});
