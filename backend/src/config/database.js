/**
 * DATABASE CONFIGURATION
 * 
 * LEARNING: This file initializes Prisma Client
 * Prisma Client is your connection to the database
 * 
 * WHY A SEPARATE FILE?
 * - Single source of truth for database connection
 * - Prevents multiple Prisma Client instances
 * - Easy to import anywhere: import prisma from './config/database.js'
 */

import { PrismaClient } from '@prisma/client';

// LEARNING: Check if we already have a Prisma Client instance (prevents duplicates)
const globalForPrisma = global;

// LEARNING: Create Prisma Client with logging options
export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn']  // In development: log all SQL queries (great for learning!)
    : ['error'],                   // In production: only log errors
});

// LEARNING: In development, save the instance globally to prevent hot-reload issues
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * LEARNING: How to use Prisma Client in other files:
 * 
 * import { prisma } from './config/database.js';
 * 
 * // Find all users
 * const users = await prisma.user.findMany();
 * 
 * // Find one user by email
 * const user = await prisma.user.findUnique({ 
 *   where: { email: 'user@example.com' } 
 * });
 * 
 * // Create a new user
 * const newUser = await prisma.user.create({
 *   data: {
 *     email: 'new@example.com',
 *     username: 'newuser',
 *     password: 'hashedpassword123'
 *   }
 * });
 * 
 * DOCUMENTATION: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference
 */

