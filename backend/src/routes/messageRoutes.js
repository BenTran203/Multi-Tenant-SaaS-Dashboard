/**
 * ============================================================================
 * MESSAGE ROUTES
 * ============================================================================
 * 
 * CONCEPT: Resource Hierarchy
 * Messages belong to Channels.
 * - Fetch: GET /api/channels/:channelId/messages
 * - Create: POST /api/channels/:channelId/messages
 * 
 * Note: Deletion is by Message ID directly (unique globally).
 */

import express from 'express';
import {
  getMessages,
  createMessage,
  deleteMessage
} from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';
import {
  createMessageValidation,
  handleValidationErrors
} from '../utils/validation.js';

const router = express.Router();

/**
 * GET /api/channels/:channelId/messages
 * Get messages from a channel (with pagination)
 */
router.get(
  '/channels/:channelId/messages',
  authenticate,
  getMessages
);

/**
 * POST /api/channels/:channelId/messages
 * Create a message (REST API fallback)
 */
router.post(
  '/channels/:channelId/messages',
  authenticate,
  createMessageValidation,
  handleValidationErrors,
  createMessage
);

/**
 * DELETE /api/messages/:id
 * Delete a message
 */
router.delete(
  '/messages/:id',
  authenticate,
  deleteMessage
);

export default router;

