/**
 * ============================================================================
 * AUTHENTICATION ROUTES
 * ============================================================================

 */

import express from "express";
import {
  register,
  login,
  getCurrentUser,
  requestPasswordReset,
  resetPassword,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import {
  registerValidation,
  loginValidation,
  handleValidationErrors,
} from "../utils/validation.js";

const router = express.Router();

router.post("/register", registerValidation, handleValidationErrors, register);

// Login route
router.post("/login", loginValidation, handleValidationErrors, login);

// Password reset route
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

// Profile route
router.get("/me", authenticate, getCurrentUser);

export default router;
