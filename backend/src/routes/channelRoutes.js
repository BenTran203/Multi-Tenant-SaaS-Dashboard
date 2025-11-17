/**
 * CHANNEL ROUTES
 */

import express from 'express';
import {
  createChannel,
  getServerChannels
} from '../controllers/channelController.js';
import { authenticate } from '../middleware/auth.js';
import {
  createChannelValidation,
  handleValidationErrors
} from '../utils/validation.js';

const router = express.Router();

/**
 * POST /api/servers/:serverId/channels
 * Create a new channel in a server
 */
router.post(
  '/servers/:serverId/channels',
  authenticate,
  createChannelValidation,
  handleValidationErrors,
  createChannel
);

/**
 * GET /api/servers/:serverId/channels
 * Get all channels in a server
 */
router.get(
  '/servers/:serverId/channels',
  authenticate,
  getServerChannels
);

export default router;

