# ============================================
# CHATWAVE BACKEND DOCKERFILE
# ============================================
# 
# Production-ready Node.js + Prisma backend
# 
# Build: docker build -t chatwave-backend .
# Run:   docker run -p 5000:5000 --env-file .env chatwave-backend

# ============================================
# STAGE 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

# Install OpenSSL (required by Prisma)
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for Prisma)
RUN npm ci

# ============================================
# STAGE 2: Build (Prisma Generation)
# ============================================
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy Prisma schema
COPY prisma ./prisma

# Copy package files
COPY package*.json ./

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY src ./src

# ============================================
# STAGE 3: Production Runtime
# ============================================
FROM node:20-alpine AS production

# Install OpenSSL and dumb-init (for proper signal handling)
RUN apk add --no-cache openssl dumb-init

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built artifacts from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Switch to non-root user
USER nodejs

# Expose port (adjust if different)
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server with dumb-init (handles signals properly)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]

# ============================================
# ENVIRONMENT VARIABLES (set via .env or docker-compose)
# ============================================
# DATABASE_URL=postgresql://user:password@host:5432/dbname
# JWT_SECRET=your-secret-key
# FRONTEND_URL=http://localhost:5173
# PORT=5000

# ============================================
# USAGE NOTES
# ============================================
#
# BUILD:
#   docker build -t chatwave-backend .
#
# RUN (with .env file):
#   docker run -p 5000:5000 --env-file .env chatwave-backend
#
# RUN (with environment variables):
#   docker run -p 5000:5000 \
#     -e DATABASE_URL=postgresql://... \
#     -e JWT_SECRET=your-secret \
#     chatwave-backend
#
# RUN MIGRATIONS (before starting):
#   docker run --env-file .env chatwave-backend npx prisma migrate deploy
#
# SHELL ACCESS (for debugging):
#   docker exec -it <container_id> sh
