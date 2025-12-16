/**
 * ========================================
 * MAIN SERVER FILE - Entry Point
 * ========================================
 */

import express from "express";
import { createWebServer } from "./utils/serverFactory.js";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { prisma } from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import serverRoutes from "./routes/serverRoutes.js";
import channelRoutes from "./routes/channelRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import { startServerCodeCron } from "./jobs/serverCodeCron.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import {
  setupSocketHandlers,
  setupPresenceHandlers,
} from "./socket/socketHandlers.js";
dotenv.config();
const app = express();
const httpServer = createWebServer(app);

// ============================================
// Socket .io
// ============================================

let io;

try {
  console.log("Creating Socket.io server...");
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  console.log("✅ Socket.io server created!");

  // Setup Socket.io handlers immediately after creation
  setupSocketHandlers(io);
  setupPresenceHandlers(io);
  console.log("✅ Socket.io handlers ready!");
} catch (error) {
  console.error("❌ Failed to setup Socket.io:", error);
  console.warn("⚠️  Real-time messaging will NOT work");
}

try {
  startServerCodeCron();
  console.log("✅ Server code regeneration cron job started");
} catch (error) {
  console.error("❌ Failed to start cron jobs:", error);
}

// ============================================
// MIDDLEWARE
// ============================================

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded data (forms)
app.use(express.urlencoded({ extended: true }));

// Rate limiting (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
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
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use("/api/auth", limiter, authRoutes); //Apply limter to authentication
app.use("/api/servers", serverRoutes);
app.use("/api", channelRoutes);
app.use("/api", messageRoutes);

// app.use('/api/me', userProfile)
app.use("/api/users", userRoutes);

// 404 handler (must be AFTER all routes)
app.use(notFoundHandler);

// Error handler (must be LAST)
app.use(errorHandler);

// ============================================
// DATABASE CONNECTION
// ============================================

const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
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
      console.log("\n🚀 Server is running!");
      console.log(`📡 REST API: http://localhost:${PORT}`);
      console.log(`⚡ WebSocket: ws://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  try {
    await prisma.$disconnect();
    console.log("Database disconnected");
  } catch (error) {
    console.error("⚠️  Database disconnect failed:", error);
  }

  httpServer.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("❌ Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer();
