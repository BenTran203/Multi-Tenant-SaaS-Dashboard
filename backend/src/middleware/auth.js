/**
 * AUTHENTICATION MIDDLEWARE
 * 
 * LEARNING: Middleware is a function that runs BEFORE your route handler
 * It can:
 * - Modify the request/response objects
 * - End the request-response cycle
 * - Call the next middleware in the stack
 * 
 * This middleware checks if the user is authenticated (has a valid JWT token)
 * 
 * FLOW:
 * Client Request → auth middleware → (if valid) → Route Handler
 *                     ↓ (if invalid)
 *                  401 Error Response
 */

import { verifyToken } from '../config/jwt.js';
import { prisma } from '../config/database.js';

/**
 * Middleware to protect routes (require authentication)
 * 
 * LEARNING: This checks for a JWT token in the request header
 * If valid, it adds the user object to req.user so route handlers can use it
 * If invalid, it returns a 401 Unauthorized error
 * 
 * HOW TO USE:
 * import { authenticate } from './middleware/auth.js';
 * router.get('/protected-route', authenticate, (req, res) => {
 *   // req.user is now available!
 *   console.log(req.user);
 * });
 */
export const authenticate = async (req, res, next) => {
  try {
    // LEARNING: Get the Authorization header
    // Format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    const authHeader = req.headers.authorization;

    // LEARNING: Check if Authorization header exists
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'No authorization token provided' 
      });
    }

    // LEARNING: Check if it starts with "Bearer "
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Invalid authorization format. Use: Bearer <token>' 
      });
    }

    // LEARNING: Extract the token (remove "Bearer " prefix)
    // "Bearer token123" → "token123"
    const token = authHeader.substring(7); // "Bearer " is 7 characters

    // LEARNING: Verify the token
    // This throws an error if token is invalid or expired
    const decoded = verifyToken(token);

    // LEARNING: Get the full user from database
    // WHY?: The token only contains userId and email, but we might need more user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
        // LEARNING: NEVER send the password, even if it's hashed!
        password: false
      }
    });

    // LEARNING: Check if user still exists
    // WHY?: User might have been deleted after token was issued
    if (!user) {
      return res.status(401).json({ 
        error: 'User no longer exists' 
      });
    }

    // LEARNING: Attach user to request object
    // Now any route handler can access req.user
    req.user = user;

    // LEARNING: Call next() to pass control to the next middleware/route handler
    // If you forget next(), the request will hang forever!
    next();

  } catch (error) {
    // LEARNING: If anything goes wrong (invalid token, database error, etc.)
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

