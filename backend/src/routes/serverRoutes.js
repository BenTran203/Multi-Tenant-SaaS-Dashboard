/**
 * ============================================================================
 * SERVER ROUTES
 * ============================================================================
 * 
 * CONCEPT: Protected Routes
 * All routes in this file require the user to be logged in.
 * We use the `authenticate` middleware to enforce this.
 */

import express from 'express';
import {
  createServer,
  getUserServers,
  getServerById,
  joinServer
} from '../controllers/serverController.js';
import { authenticate } from '../middleware/auth.js';
import {
  createServerValidation,
  joinServerValidation,
  handleValidationErrors
} from '../utils/validation.js';

const router = express.Router();

// LEARNING: All routes below require authentication
// We could use router.use(authenticate) to apply to all routes

/**
 * POST /api/servers
 * Create a new server
 */
router.post(
  '/',
  authenticate,
  createServerValidation,
  handleValidationErrors,
  createServer
);

/**
 * GET /api/servers
 * Get all servers the user is a member of
 */
router.get(
  '/',
  authenticate,
  getUserServers
);

/**
 * GET /api/servers/:id
 * Get a specific server by ID
 */
router.get(
  '/:id',
  authenticate,
  getServerById
);

/**
 * POST /api/servers/join
 * Join a server with invite code
 */
router.post(
  '/join',
  authenticate,
  joinServerValidation,
  handleValidationErrors,
  joinServer
);

export default router;

