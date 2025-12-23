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
  verifyEmail,
  resendVerification,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import {
  registerValidation,
  loginValidation,
  handleValidationErrors,
} from "../utils/validation.js";

const router = express.Router();

// Registration & Login
router.post("/register", registerValidation, handleValidationErrors, register);
router.post("/login", loginValidation, handleValidationErrors, login);

// Email verification
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);

// Password reset route
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

// Profile route
router.get("/me", authenticate, getCurrentUser);

export default router;
