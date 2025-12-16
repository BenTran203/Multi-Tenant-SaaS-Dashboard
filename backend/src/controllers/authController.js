/**
 * ============================================================================
 * AUTHENTICATION CONTROLLER
 * ============================================================================
 */

import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../config/database.js";
import { generateToken } from "../config/jwt.js";
import { resetPasswordEmail } from '../config/email.js';

/**
 * Register a new user
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
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        error: "No account found with this email address",
        errorType: "EMAIL_NOT_FOUND",
      });
    }

    // 2. Verify password
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
 */
