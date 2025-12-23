/**
 * ============================================================================
 * AUTHENTICATION CONTROLLER
 * ============================================================================
 */

import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../config/database.js";
import { generateToken } from "../config/jwt.js";
import { resetPasswordEmail, sendVerificationEmail } from '../config/email.js';
import { registerValidator, loginValidator, resetPasswordValidator } from '../middleware/validator.js';

/**
 * Register a new user
 */
export const register = async (req, res) => {
  console.log('\n📝 [REGISTER] Request received:', {
    email: req.body?.email,
    username: req.body?.username,
    hasPassword: !!req.body?.password,
    timestamp: new Date().toISOString(),
  });

  try {
    const { email, username, password } = req.body;

    // 1. Validate input
    console.log('🔍 [REGISTER] Validating input...');
    const validation = registerValidator.safeParse(req.body);
    
    if (!validation.success) {
      // Format validation errors for user-friendly display
      const errors = validation.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      console.log('❌ [REGISTER] Validation failed:', errors);
      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

    console.log('✅ [REGISTER] Validation passed');
    console.log('🔍 [REGISTER] Checking for existing user...');
     
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { username: username }],
      },
    });
    
    if (existingUser) {
      console.log('⚠️ [REGISTER] User already exists');
      return res.status(409).json({
        error: "User with this email or username already exists",
      });
    }

    console.log('✅ [REGISTER] User is unique, proceeding...');

    // 2. Hash password
    console.log('🔐 [REGISTER] Hashing password...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    console.log('✅ [REGISTER] Verification token generated');

    // 4. Create user (unverified by default)
    console.log('💾 [REGISTER] Creating user in database...');
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        isEmailVerified: false,
        emailVerificationToken: hashedVerificationToken,
        emailVerificationExpires: verificationExpiry,
      },
      select: {
        // Security: Never return the password hash to the client!
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    // 5. Send verification email (non-blocking - don't crash if it fails)
    try {
      console.log('📧 Attempting to send verification email to:', email);
      await sendVerificationEmail(email, username, verificationToken);
      console.log('✅ Verification email sent to', email);
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', {
        error: emailError.message,
        stack: emailError.stack,
        email: email,
      });
      // Don't fail registration if email fails - user can request resend
      console.log('⚠️ Continuing registration despite email failure...');
    }

    // 6. Generate Token (but user still needs to verify email before using the app)
    console.log('🎫 [REGISTER] Generating JWT token...');
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });
    console.log('✅ [REGISTER] Token generated successfully');

    console.log('🎉 [REGISTER] Registration complete! Sending response...');

    // LEARNING: Send successful response with verification notice
    res.status(201).json({
      message: "Registration successful! Please check your email to verify your account.",
      token,
      user,
      requiresVerification: true,
    });
  } catch (error) {
    console.error('💥 [REGISTER] FATAL ERROR:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
    });

    // Make sure we ALWAYS send a response
    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to register user",
        details: error.message,
      });
    }
  }
};

/**
 * Login a user
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    const validation = loginValidator.safeParse(req.body);
    
    if (!validation.success) {
      const errors = validation.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

    // 2. Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        error: "No account found with this email address",
        errorType: "EMAIL_NOT_FOUND",
      });
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Incorrect password. Please try again.",
        errorType: "INVALID_PASSWORD",
      });
    }

    // 4. Issue Token
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
 * Verify email with token
 */
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: "Verification token is required"
      });
    }

    // Hash the provided token to match database
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: {
          gt: new Date(), // Token not expired
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        error: "Invalid or expired verification token",
        errorType: "INVALID_TOKEN",
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.json({
        message: "Email already verified! You can now use ChatWave.",
        alreadyVerified: true,
      });
    }

    // Update user - mark as verified and clear token
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    // Generate JWT token for auto-login
    const authToken = generateToken({
      userId: updatedUser.id,
      email: updatedUser.email,
    });

    res.json({
      message: "Email verified successfully! You can now use ChatWave.",
      token: authToken,
      user: updatedUser,
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      error: "Failed to verify email",
      details: error.message,
    });
  }
};


/**
 * Resend verification email
 */
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required"
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      // Return success anyway to prevent email enumeration
      return res.json({
        message: "If an account with that email exists, we've sent a verification link."
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.json({
        message: "This email is already verified!",
        alreadyVerified: true,
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: hashedVerificationToken,
        emailVerificationExpires: verificationExpiry,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.username, verificationToken);
      console.log(`Verification email resent to ${user.email}`);
    } catch (emailError) {
      console.error('Failed to resend verification email:', emailError);
      return res.status(500).json({
        error: "Failed to send verification email. Please try again later."
      });
    }

    res.json({
      message: "Verification email sent! Please check your inbox."
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      error: "Failed to resend verification email",
      details: error.message,
    });
  }
};

/**
 * Get User for Side bar
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
 * Send request for Password reset
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

    // Set expiration (10 minutes from time sent)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

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

/**
 * Password reset
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validate input - Check password strength
    const validation = resetPasswordValidator.safeParse(req.body);
    
    if (!validation.success) {
      const errors = validation.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

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
        error: "Invalid or expired reset token" 
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
