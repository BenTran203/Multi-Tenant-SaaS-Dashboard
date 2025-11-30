/**
 * ========================================
 * MAIN SERVER FILE - Entry Point
 * ========================================
 * 
 * Sets up:
 * - Express server (REST API)
 * - Socket.io (WebSocket for real-time)
 * - Database connection (Prisma)
 * - Middleware & Routes
 * - Error handling
 */

import express from 'express';
import { createWebServer } from './utils/serverFactory.js'; // Import the helper
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { prisma } from './config/database.js';
import authRoutes from './routes/authRoutes.js'; // Import routes
import serverRoutes from './routes/serverRoutes.js';
import channelRoutes from './routes/channelRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';// Import middleware
import { setupSocketHandlers, setupPresenceHandlers } from './socket/socketHandlers.js'; // Import socket handlers
dotenv.config();
const app = express();
// HTTPS Support 
const httpServer = createWebServer(app);

// ============================================
// Socket .io
// ============================================
console.log('Creating Socket.io server...');
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
console.log('Socket.io server created!');

// ============================================
// MIDDLEWARE
// ============================================

// CORS - Allow frontend to make requests
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded data (forms)
app.use(express.urlencoded({ extended: true }));

// Rate limiting - Prevent abuse (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', limiter, authRoutes); //Apply limter to authentication
app.use('/api/servers', serverRoutes);
app.use('/api', channelRoutes);
app.use('/api', messageRoutes);  

// 404 handler (must be AFTER all routes)
app.use(notFoundHandler);

// Error handler (must be LAST)
app.use(errorHandler);

// ============================================
// SOCKET.IO SETUP
// ============================================

console.log('Setting up Socket.io event handlers...');
setupSocketHandlers(io);
setupPresenceHandlers(io)
console.log('Socket.io handlers ready!');

// ============================================
// DATABASE CONNECTION
// ============================================

const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDatabase();

    httpServer.listen(PORT, () => {
      console.log('\n🚀 Server is running!');
      console.log(`📡 REST API: http://localhost:${PORT}`);
      console.log(`⚡ WebSocket: ws://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`\n📚 API Documentation:`);
      console.log(`   POST   /api/auth/register`);
      console.log(`   POST   /api/auth/login`);
      console.log(`   GET    /api/auth/me`);
      console.log(`   POST   /api/servers`);
      console.log(`   GET    /api/servers`);
      console.log(`   POST   /api/servers/join`);
      console.log(`   GET    /api/servers/:id`);
      console.log(`   POST   /api/servers/:serverId/channels`);
      console.log(`   GET    /api/servers/:serverId/channels`);
      console.log(`   GET    /api/channels/:channelId/messages`);
      console.log(`   POST   /api/channels/:channelId/messages`);
      console.log(`\n📖 Open README.md for setup instructions\n`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  await prisma.$disconnect();
  
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

// ============================================
// 📚 LEARNING NOTES
// ============================================

/**
 * REQUEST FLOW (HTTP/REST):
 * 
 * Client Request
 *   ↓
 * Middleware Chain (CORS → JSON Parser → Rate Limiter → Logger)
 *   ↓
 * Router (matches URL to route)
 *   ↓
 * Route Middleware (validation → error checking)
 *   ↓
 * Controller (business logic, database queries)
 *   ↓
 * Response (res.json)
 *   ↓
 * Error Handler (if error occurs)
 */

/**
 * WEBSOCKET FLOW (Socket.io):
 * 
 * Client Connects
 *   ↓
 * Socket Middleware (authenticate token)
 *   ↓
 * Connection Event ('connection' fires)
 *   ↓
 * Client Emits Event (e.g., 'send-message')
 *   ↓
 * Server Handler (save to DB, broadcast to room)
 *   ↓
 * Clients Receive Event ('new-message')
 */

/**
 * 🔨 TASKS TO IMPLEMENT:
 * 
 * 
 * 2. Add More Features (See .github/copilot-instructions.md)
 *    - Typing indicators
 *    - User presence (online/offline)
 *    - Message reactions
 *    - File uploads
 */

