/**
 * AUTHENTICATION CONTROLLER
 * 
 * LEARNING: Controllers contain the business logic for your routes
 * They handle requests, process data, and send responses
 * 
 * RESPONSIBILITIES:
 * - Validate input (with middleware)
 * - Interact with database (via Prisma)
 * - Handle business logic
 * - Send responses
 * 
 * This controller handles:
 * - User registration
 * - User login
 * - Getting current user info
 */

import bcrypt from 'bcrypt';
import { prisma } from '../config/database.js';
import { generateToken } from '../config/jwt.js';

/**
 * Register a new user
 * 
 * LEARNING: Registration flow:
 * 1. Check if user already exists
 * 2. Hash the password (NEVER store plain text!)
 * 3. Create user in database
 * 4. Generate JWT token
 * 5. Return token and user info
 * 
 * POST /api/auth/register
 * Body: { email, username, password }
 */
export const register = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // LEARNING: Check if user already exists
    // Why? Email and username must be unique
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email or username already exists'
      });
    }

    // LEARNING: Hash the password with bcrypt
    // - First argument: plain text password
    // - Second argument: salt rounds (higher = more secure but slower)
    // - Returns: hashed password string
    // 
    // WHY HASH?
    // - If database is breached, attackers can't read passwords
    // - Bcrypt is "one-way" - can't reverse it to get original password
    // - Each hash is unique even for the same password (due to salt)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // LEARNING: Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword
      },
      select: {
        // LEARNING: Only select fields we want to return (exclude password!)
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    // LEARNING: Generate JWT token
    // This token will be used for authentication in future requests
    const token = generateToken({
      userId: user.id,
      email: user.email
    });

    // LEARNING: Send successful response
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Failed to register user',
      details: error.message 
    });
  }
};

/**
 * Login a user
 * 
 * LEARNING: Login flow:
 * 1. Find user by email
 * 2. Compare password with hashed password
 * 3. Generate JWT token
 * 4. Return token and user info
 * 
 * POST /api/auth/login
 * Body: { email, password }
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // LEARNING: Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // LEARNING: Check if user exists
    if (!user) {
      // SECURITY NOTE: Don't reveal if email exists or password is wrong
      // Just say "Invalid credentials" for both cases
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // LEARNING: Compare provided password with hashed password
    // bcrypt.compare() hashes the provided password and compares it
    // Returns true if they match, false otherwise
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // LEARNING: Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email
    });

    // LEARNING: Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Failed to login',
      details: error.message 
    });
  }
};

/**
 * Get current user info
 * 
 * LEARNING: This route is protected by authenticate middleware
 * The middleware adds req.user, so we just return it
 * 
 * GET /api/auth/me
 * Headers: { Authorization: "Bearer <token>" }
 */
export const getCurrentUser = async (req, res) => {
  try {
    // LEARNING: req.user is set by authenticate middleware
    // We already have the user, just return it!
    res.json({
      user: req.user
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      error: 'Failed to get user info',
      details: error.message 
    });
  }
};

/**
 * TODO (LEARNING): Implement password reset functionality
 * 
 * CHALLENGE: Create these functions:
 * 1. requestPasswordReset(req, res)
 *    - Generate a reset token
 *    - Save token to database with expiration
 *    - Send email with reset link (use nodemailer)
 * 
 * 2. resetPassword(req, res)
 *    - Verify reset token
 *    - Hash new password
 *    - Update user password
 *    - Invalidate reset token
 * 
 * HINT: Add a passwordResetToken and passwordResetExpires field to User model
 * RESOURCES: https://nodemailer.com/about/
 */

/**
 * LEARNING: Authentication Security Best Practices
 * 
 * ✅ DO:
 * - Always hash passwords (never store plain text)
 * - Use bcrypt with at least 10 salt rounds
 * - Use JWT for stateless authentication
 * - Set token expiration (e.g., 7 days)
 * - Validate all inputs
 * - Use HTTPS in production
 * - Rate limit login attempts
 * 
 * ❌ DON'T:
 * - Store passwords in plain text
 * - Use weak hashing algorithms (MD5, SHA1)
 * - Put sensitive data in JWT payload (it's not encrypted!)
 * - Share JWT_SECRET publicly
 * - Allow unlimited login attempts
 * - Reveal if email exists during login
 */

