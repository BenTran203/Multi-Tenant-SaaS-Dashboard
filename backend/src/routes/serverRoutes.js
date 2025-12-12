/**
 * ============================================================================
 * SERVER ROUTES
 * ============================================================================
 */

import express from 'express';
import {
  createServer,
  getUserServers,
  getServerById,
  joinServer,
  updateServer,
  deleteServer,
  getServerMember,
  kickMember,
  updateMemberNickname,
  leaveServer,
  transferOwnership,
  regenerateServerCode
} from '../controllers/serverController.js';
import { authenticate } from '../middleware/auth.js';
import {
  createServerValidation,
  joinServerValidation,
  handleValidationErrors
} from '../utils/validation.js';

const router = express.Router();

/**
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
 * Get all servers the user is a member of
 */
router.get(
  '/',
  authenticate,
  getUserServers
);

/**
 * Get a specific server by ID
 */
router.get(
  '/:id',
  authenticate,
  getServerById
);

/**
 * Join a server with invite code
 */
router.post(
  '/join',
  authenticate,
  joinServerValidation,
  handleValidationErrors,
  joinServer
);

//Delete server - Leave server
router.delete('/:id', authenticate, deleteServer);
router.delete('/:id/leave', authenticate, leaveServer);
router.post('/:id/transfer-ownership', authenticate, transferOwnership);
router.post('/:id/regenerate-code', authenticate, regenerateServerCode);

//Server setting routes
router.put('/:id', authenticate, updateServer);
router.get('/:serverId/members', authenticate, getServerMember);
router.delete('/:serverId/members/:memberId', authenticate, kickMember);
router.patch('/:serverId/members/:memberId/nickname', authenticate, updateMemberNickname);


export default router;

