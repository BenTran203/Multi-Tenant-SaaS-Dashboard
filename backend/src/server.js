/**
 * MAIN SERVER FILE
 * 
 * LEARNING: This is the entry point of your backend application
 * It sets up:
 * - Express server (REST API)
 * - Socket.io (WebSocket for real-time communication)
 * - Database connection (Prisma)
 * - Middleware (CORS, JSON parsing, etc.)
 * - Routes
 * - Error handling
 * 
 * START SERVER:
 * npm run dev (uses nodemon for auto-restart)
 * npm start (production)
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load environment variables from .env file
dotenv.config();

// Import configuration
import { prisma } from './config/database.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import serverRoutes from './routes/serverRoutes.js';
import channelRoutes from './routes/channelRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import socket handlers
import { setupSocketHandlers } from './socket/socketHandlers.js';

// ============================================
// APP INITIALIZATION
// ============================================

// LEARNING: Create Express app
const app = express();

// LEARNING: Create HTTP server (needed for Socket.io)
// Socket.io needs an HTTP server, not just Express
const httpServer = createServer(app);

// LEARNING: Create Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// ============================================
// MIDDLEWARE
// ============================================

/**
 * LEARNING: CORS (Cross-Origin Resource Sharing)
 * 
 * WHY?
 * - Frontend runs on localhost:5173
 * - Backend runs on localhost:5000
 * - Different ports = different origins
 * - Browser blocks requests by default
 * - CORS allows specific origins to make requests
 * 
 * SECURITY:
 * - In development: Allow localhost:5173
 * - In production: Only allow your frontend domain
 */
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

/**
 * LEARNING: Parse JSON request bodies
 * 
 * WHY?
 * - Clients send data as JSON
 * - This middleware parses it into req.body
 * - Without this, req.body would be undefined
 */
app.use(express.json());

/**
 * LEARNING: Parse URL-encoded data (form submissions)
 */
app.use(express.urlencoded({ extended: true }));

/**
 * LEARNING: Rate limiting (prevent abuse)
 * 
 * WHY?
 * - Prevents brute force attacks
 * - Prevents API abuse
 * - Protects server resources
 * 
 * CONFIGURATION:
 * - windowMs: Time window (15 minutes)
 * - max: Maximum requests per window (100 requests)
 * - message: Error message when limit exceeded
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false
});

// TODO (LEARNING): Apply rate limiter to specific routes
// HINT: app.use('/api/auth', limiter, authRoutes);
// WHY?: Auth routes need rate limiting to prevent brute force attacks

/**
 * LEARNING: Request logging (for development)
 */
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

/**
 * LEARNING: Health check endpoint
 * 
 * WHY?
 * - Check if server is running
 * - Used by monitoring tools
 * - Used by load balancers
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * LEARNING: API Routes
 * 
 * PATTERN: app.use('/prefix', routes)
 * - All routes in authRoutes will be prefixed with /api/auth
 * - Example: POST /api/auth/register, POST /api/auth/login
 */
app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api', channelRoutes);  // Already has /servers/:serverId/channels
app.use('/api', messageRoutes);  // Already has /channels/:channelId/messages

/**
 * LEARNING: 404 handler (must be AFTER all routes)
 */
app.use(notFoundHandler);

/**
 * LEARNING: Error handler (must be LAST)
 */
app.use(errorHandler);

// ============================================
// SOCKET.IO SETUP
// ============================================

// LEARNING: Setup Socket.io event handlers
setupSocketHandlers(io);

// ============================================
// DATABASE CONNECTION
// ============================================

/**
 * LEARNING: Test database connection on startup
 */
const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1); // Exit if database connection fails
  }
};

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start HTTP server (not app.listen, because we need Socket.io)
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

/**
 * LEARNING: Graceful shutdown
 * 
 * WHY?
 * - Close database connections properly
 * - Finish ongoing requests
 * - Prevent data corruption
 */
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  // Close database connection
  await prisma.$disconnect();
  
  // Close server
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// LEARNING: Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
startServer();

/**
 * LEARNING: Server Architecture Summary
 * 
 * 1. CLIENT MAKES HTTP REQUEST:
 *    fetch('http://localhost:5000/api/auth/login', {...})
 *    ↓
 * 2. EXPRESS MIDDLEWARE:
 *    CORS → JSON Parser → Rate Limiter → Logger
 *    ↓
 * 3. ROUTER:
 *    Matches URL to route (/api/auth/login)
 *    ↓
 * 4. ROUTE MIDDLEWARE:
 *    Validation → Error Checking
 *    ↓
 * 5. CONTROLLER:
 *    Business logic (query database, etc.)
 *    ↓
 * 6. RESPONSE:
 *    res.json({ token, user })
 *    ↓
 * 7. ERROR HANDLER (if error occurs):
 *    Catches error, sends proper response
 * 
 * WEBSOCKET FLOW:
 * 1. CLIENT CONNECTS:
 *    const socket = io('http://localhost:5000', { auth: { token } })
 *    ↓
 * 2. SOCKET MIDDLEWARE:
 *    Authenticates token
 *    ↓
 * 3. CONNECTION EVENT:
 *    'connection' event fires
 *    ↓
 * 4. CLIENT EMITS EVENT:
 *    socket.emit('send-message', { channelId, content })
 *    ↓
 * 5. SERVER HANDLER:
 *    Saves to database, broadcasts to room
 *    ↓
 * 6. CLIENTS RECEIVE:
 *    socket.on('new-message', ({ message }) => {...})
 */

