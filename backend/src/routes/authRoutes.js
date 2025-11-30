/**
 * ============================================================================
 * AUTHENTICATION ROUTES
 * ============================================================================
 *
 * CONCEPT: Routing
 * Routes map HTTP requests (GET, POST) to Controller functions.
 *
 * PATTERN:
 * router.METHOD(path, middleware..., controller)
 *
 * EXAMPLE:
 * router.post('/login', validateInput, loginController)
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

/**
 * POST /api/auth/register
 * Public route - anyone can register
 *
 * LEARNING: Middleware chain:
 * 1. registerValidation - validates email, username, password
 * 2. handleValidationErrors - checks if validation failed
 * 3. register - creates the user
 */
router.post("/register", registerValidation, handleValidationErrors, register);

// Login route
router.post("/login", loginValidation, handleValidationErrors, login);

// Password reset route
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

// Profile route
router.get("/me", authenticate, getCurrentUser);

export default router;
/**
 * GET /api/auth/me
 * Protected route - requires authentication
 *
 * LEARNING: authenticate middleware runs first
 * - Checks for JWT token
 * - Verifies token
 * - Adds req.user
 * - If anything fails, returns 401 error
 * - If successful, calls getCurrentUser
 */

/**
 * LEARNING: How to test these routes with Postman/Thunder Client:
 *
 * 1. REGISTER:
 *    POST http://localhost:5173/api/auth/register
 *    Body (JSON):
 *    {
 *      "email": "test@example.com",
 *      "username": "testuser",
 *      "password": "password123"
 *    }
 *    Response: { token, user }
 *
 * 2. LOGIN:
 *    POST http://localhost:5173/api/auth/login
 *    Body (JSON):
 *    {
 *      "email": "test@example.com",
 *      "password": "password123"
 *    }
 *    Response: { token, user }
 *
 * 3. GET CURRENT USER:
 *    GET http://localhost:5173/api/auth/me
 *    Headers:
 *    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *    Response: { user }
 */
