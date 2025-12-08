/**
 * ============================================================================
 * AUTHENTICATION CONTROLLER
 * ============================================================================
 *
 * CONCEPT: Authentication vs Authorization
 * - Authentication (AuthN): "Who are you?" (Login, Register)
 * - Authorization (AuthZ): "What are you allowed to do?" (Access Control)
 *
 * LOGIC FLOW:
 * 1. Client sends credentials (email/password).
 * 2. Server validates credentials against Database.
 * 3. Server issues a JWT (JSON Web Token).
 * 4. Client attaches JWT to future requests.
 */

import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../config/database.js";
import { generateToken } from "../config/jwt.js";
import { resetPasswordEmail } from '../config/email.js';

/**
 * Register a new user
 *
 * LOGIC:
 * 1. Check if email/username is taken.
 * 2. Hash the password (security critical!).
 * 3. Create user in DB.
 * 4. Issue JWT token immediately so they are logged in.
 *
 * POST /api/auth/register
 * Body: { email, username, password }
 */
export const register = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // 1. Check uniqueness
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { username: username }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "User with this email or username already exists",
      });
    }

    // 2. Hash password
    // CONCEPT: Hashing
    // We never store plain text passwords. We store a "hash" - a one-way scrambled version.
    // '10' is the salt rounds (cost factor). Higher = safer but slower.
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
      select: {
        // Security: Never return the password hash to the client!
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    // 4. Generate Token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // LEARNING: Send successful response
    res.status(201).json({
      message: "User registered successfully",
      token,
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: "Failed to register user",
      details: error.message,
    });
  }
};

/**
 * Login a user
 *
 * LOGIC:
 * 1. Find user by email.
 * 2. Compare provided password with stored hash.
 * 3. If match, issue JWT.
 *
 * POST /api/auth/login
 * Body: { email, password }
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // SECURITY NOTE: Specific error messages
    // Trade-off: Better UX vs User Enumeration risk
    // Mitigation: Rate limiting + account lockout (recommended for production)
    if (!user) {
      return res.status(401).json({
        error: "No account found with this email address",
        errorType: "EMAIL_NOT_FOUND",
      });
    }

    // 2. Verify password
    // bcrypt.compare() hashes the input and checks if it matches the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Incorrect password. Please try again.",
        errorType: "INVALID_PASSWORD",
      });
    }

    // 3. Issue Token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Remove sensitive data before sending
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: "Login successful",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Failed to login",
      details: error.message,
    });
  }
};

/**
 * Get current user info
 *
 * LOGIC:
 * - This route is protected by `authenticate` middleware.
 * - The middleware verifies the JWT and attaches `req.user`.
 * - We simply return that user object.
 *
 * GET /api/auth/me
 */
export const getCurrentUser = async (req, res) => {
  try {
    // req.user is populated by the middleware
    res.json({
      user: req.user,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      error: "Failed to get user info",
      details: error.message,
    });
  }
};

/**
 * Forgot Password (Development Mode)
 *
 * LOGIC:
 * - In a real app, we would send an email with a reset link.
 * - We will be using resend to send a reset URL token for confirmation
 * POST /api/auth/forgot-password
 */
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // We return success even if user doesn't exist to prevent enumeration
      return res.json({ 
        message: "We have sent you a reset link, you should be able to recieve it in your inbox." 
      });
    }

    // Generate reset token (random 32 bytes)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expiration (1 hour from now)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Save to database
    await prisma.user.update({
      where: { email },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: expiresAt,
      },
    });

    // Send email with plain token (not hashed)
    await resetPasswordEmail(email, resetToken);

    res.json({ 
      message: "We have sent you a link for reseting your password" 
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: "Failed to process request" });
  }
};

//Reset Password - Step 2 (Verify Token & Update Password)
//POST /api/auth/reset-password

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Hash the provided token to match database
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date(), 
        },
      },
    });

    if (!user) {
      return res.status(400).json({ 
        error: "Can't find user or token already expired" 
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    res.json({ message: "Password reset successfully" });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: "Failed to reset password" });
  }
};


/**
 * ============================================================================
 * SECURITY BEST PRACTICES
 * ============================================================================
 * ✅ DO:
 * - Hash passwords (bcrypt).
 * - Use HTTPS in production.
 * - Validate all inputs.
 * - Rate limit login attempts (prevent brute force).
 */
