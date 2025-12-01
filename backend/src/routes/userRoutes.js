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

// GET /api/users/profile - Get current user's profile
router.get('/profile', authenticate, getProfile);

// PUT /api/users/profile - Update current user's profile
router.put(
  '/profile',
  authenticate,
  profileUpdateValidation,
  handleValidationErrors,
  updateProfile
);

// DELETE /api/users/profile - Delete current user's account
router.delete('/profile', authenticate, deleteAccount);

export default router;
