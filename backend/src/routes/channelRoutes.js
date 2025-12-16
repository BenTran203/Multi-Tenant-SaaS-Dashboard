/**
 * ============================================================================
 * CHANNEL ROUTES
 * ============================================================================
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


router.post(
  '/servers/:serverId/channels',
  authenticate,
  createChannelValidation,
  handleValidationErrors,
  createChannel
);


router.get(
  '/servers/:serverId/channels',
  authenticate,
  getServerChannels
);

export default router;

