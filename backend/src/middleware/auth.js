/**
 * ============================================================================
 * AUTHENTICATION MIDDLEWARE
 * ============================================================================
 */

import { verifyToken } from '../config/jwt.js';
import { prisma } from '../config/database.js';

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
