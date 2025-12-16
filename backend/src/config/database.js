/**
 * DATABASE CONFIGURATION
 */

import { PrismaClient } from '@prisma/client';

// LEARNING: Check if we already have a Prisma Client instance (prevents duplicates)
const globalForPrisma = global;

// LEARNING: Create Prisma Client with logging options
export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn']  
    : ['error'],                  
});

// LEARNING: In development, save the instance globally to prevent hot-reload issues
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

