/**
 * JWT (JSON Web Token) CONFIGURATION
 * 
 * LEARNING: JWT is a way to securely transmit information between parties
 * 
 * HOW IT WORKS:
 * 1. User logs in with email/password
 * 2. Server verifies credentials
 * 3. Server creates a JWT token containing user info
 * 4. Server sends token to client
 * 5. Client stores token (usually in localStorage)
 * 6. Client sends token with every request (in Authorization header)
 * 7. Server verifies token and allows/denies access
 * 
 * WHY JWT?
 * - Stateless authentication (server doesn't need to store sessions)
 * - Scalable (works across multiple servers)
 * - Secure (cryptographically signed)
 * 
 * RESOURCES:
 * - https://jwt.io/introduction
 * - https://www.youtube.com/watch?v=7Q17ubqLfaM (JWT Explained)
 */

import jwt from 'jsonwebtoken';

/**
 * LEARNING: These values come from your .env file
 * - JWT_SECRET: Used to sign and verify tokens (keep this SECRET!)
 * - JWT_EXPIRES_IN: How long until token expires (e.g., '7d' = 7 days)
 */
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a JWT token for a user
 * 
 * LEARNING: This creates a token containing user information
 * 
 * @param {Object} payload - User data to include in token (usually { userId, email })
 * @returns {String} - JWT token string
 */
export const generateToken = (payload) => {
  // LEARNING: jwt.sign() creates a token
  // - First argument: data to include (payload)
  // - Second argument: secret key to sign with
  // - Third argument: options (expiration time, etc.)
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

/**
 * Verify a JWT token
 * 
 * LEARNING: This checks if a token is valid and not expired
 * 
 * @param {String} token - JWT token to verify
 * @returns {Object} - Decoded token payload if valid
 * @throws {Error} - If token is invalid or expired
 */
export const verifyToken = (token) => {
  try {
    // LEARNING: jwt.verify() checks the token's signature and expiration
    // If valid, returns the decoded payload
    // If invalid/expired, throws an error
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    // LEARNING: Common errors:
    // - JsonWebTokenError: Token is malformed or signature is invalid
    // - TokenExpiredError: Token has expired
    throw new Error('Invalid or expired token');
  }
};

/**
 * LEARNING: Example JWT token structure:
 * 
 * Header (algorithm and token type):
 * {
 *   "alg": "HS256",
 *   "typ": "JWT"
 * }
 * 
 * Payload (your data):
 * {
 *   "userId": "123e4567-e89b-12d3-a456-426614174000",
 *   "email": "user@example.com",
 *   "iat": 1516239022,  // Issued at time
 *   "exp": 1516325422   // Expiration time
 * }
 * 
 * Signature (Header + Payload + Secret):
 * HMACSHA256(
 *   base64UrlEncode(header) + "." + base64UrlEncode(payload),
 *   your-256-bit-secret
 * )
 * 
 * Final token looks like:
 * "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NSIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
 *       ^header^                          ^payload^                                    ^signature^
 */

