

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 
 * @param {Object} payload - User data to include in token (usually { userId, email })
 * @returns {String} - JWT token string
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

/**
 * 
 * @param {String} token - JWT token to verify
 * @returns {Object} - Decoded token payload if valid
 * @throws {Error} - If token is invalid or expired
 */
export const verifyToken = (token) => {
  try {

    return jwt.verify(token, JWT_SECRET);
  } catch (error) {

    throw new Error('Invalid or expired token');
  }
};

