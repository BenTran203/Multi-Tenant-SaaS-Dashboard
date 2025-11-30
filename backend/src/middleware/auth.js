/**
 * ============================================================================
 * AUTHENTICATION MIDDLEWARE
 * ============================================================================
 * 
 * CONCEPT: Middleware
 * Middleware functions have access to the request (req) and response (res) objects.
 * They sit "in the middle" between the raw request and your final route handler.
 * 
 * RESPONSIBILITY:
 * - Verify the JWT token from the "Authorization" header.
 * - If valid: Attach the user to `req.user` and call `next()`.
 * - If invalid: Stop the request and return 401 Unauthorized.
 */

import { verifyToken } from '../config/jwt.js';
import { prisma } from '../config/database.js';

/**
 * Protects routes by requiring a valid JWT token.
 * 
 * LOGIC FLOW:
 * 1. Check for "Authorization" header.
 * 2. Validate format ("Bearer <token>").
 * 3. Verify token signature (is it real? is it expired?).
 * 4. Fetch user from DB (ensure they still exist).
 * 5. Attach user to `req` and proceed.
 */
export const authenticate = async (req, res, next) => {
  try {
    // 1. Get Header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ 
        error: 'No authorization token provided' 
      });
    }

    // 2. Check Format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Invalid authorization format. Use: Bearer <token>' 
      });
    }

    // 3. Verify Token
    const token = authHeader.substring(7); // Remove "Bearer "
    const decoded = verifyToken(token);

    // 4. Fetch User
    // We fetch fresh data from DB to ensure the user hasn't been banned/deleted.
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
        password: false // Security: Never select password
      }
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'User no longer exists' 
      });
    }

    // 5. Attach & Proceed
    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({ 
      error: 'Invalid or expired token',
      details: error.message 
    });
  }
};

/**
 * TODO (LEARNING): Create an optional authentication middleware
 * 
 * Sometimes you want to get user data if available, but don't require it
 * Example: A public channel where logged-in users see extra features
 * 
 * CHALLENGE: Create optionalAuthenticate() that:
 * - Checks for token
 * - If valid: sets req.user
 * - If invalid/missing: sets req.user = null and continues anyway
 * - Always calls next()
 * 
 * HINT: Copy authenticate() but remove the return statements that send errors
 */
export const optionalAuthenticate = async (req, res, next) => {
  // TODO (LEARNING): Implement optional authentication
  // Your code here...
  
  next();
};

/**
 * LEARNING: How authentication works end-to-end:
 * 
 * 1. REGISTER/LOGIN:
 *    POST /api/auth/login
 *    { email, password }
 *    ↓
 *    Server verifies credentials
 *    ↓
 *    Server generates JWT token
 *    ↓
 *    Returns: { token: "eyJ...", user: {...} }
 * 
 * 2. STORING TOKEN (Frontend):
 *    localStorage.setItem('token', token);
 * 
 * 3. MAKING AUTHENTICATED REQUESTS (Frontend):
 *    fetch('/api/servers', {
 *      headers: {
 *        'Authorization': `Bearer ${token}`
 *      }
 *    });
 * 
 * 4. BACKEND RECEIVES REQUEST:
 *    Request → authenticate middleware → checks token → adds req.user → route handler
 * 
 * 5. ROUTE HANDLER:
 *    router.get('/servers', authenticate, async (req, res) => {
 *      // req.user is available!
 *      const servers = await prisma.server.findMany({
 *        where: { ownerId: req.user.id }
 *      });
 *      res.json(servers);
 *    });
 */

