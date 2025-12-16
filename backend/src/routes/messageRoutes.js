/**
 * ============================================================================
 * MESSAGE ROUTES
 * ============================================================================

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


router.get(
  '/channels/:channelId/messages',
  authenticate,
  getMessages
);


router.post(
  '/channels/:channelId/messages',
  authenticate,
  createMessageValidation,
  handleValidationErrors,
  createMessage
);


router.delete(
  '/messages/:id',
  authenticate,
  deleteMessage
);

export default router;

