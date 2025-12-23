import express from "express";
import {
  updateProfile,
  deleteAccount,
  getProfile,
} from "../controllers/userController.js";
import { authenticate } from "../middleware/auth.js";
import {
  profileUpdateValidation,
  handleValidationErrors,
} from "../utils/validation.js";

const router = express.Router();

//  Get current user's profile (alias)
router.get('/me', authenticate, getProfile);

//  Update current user's profile (alias)
router.put(
  '/me',
  authenticate,
  profileUpdateValidation,
  handleValidationErrors,
  updateProfile
);

//  Delete current user's account (alias)
router.delete('/me', authenticate, deleteAccount);

// Get current user's profile
router.get('/profile', authenticate, getProfile);

// Update current user's profile
router.put(
  '/profile',
  authenticate,
  profileUpdateValidation,
  handleValidationErrors,
  updateProfile
);

//  Delete current user's account
router.delete('/profile', authenticate, deleteAccount);

export default router;
