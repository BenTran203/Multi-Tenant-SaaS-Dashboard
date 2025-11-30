/**
 * ============================================================================
 * ERROR HANDLING MIDDLEWARE
 * ============================================================================
 * 
 * CONCEPT: Centralized Error Handling
 * Instead of writing `try/catch` and `res.status(500)` in every single route,
 * we let errors "bubble up" to this middleware.
 * 
 * MECHANISM:
 * Express identifies error handlers by their argument count: (err, req, res, next).
 * If you call `next(error)`, Express skips to this function.
 */

/**
 * Global Error Handler
 * 
 * LOGIC:
 * 1. Log the error (essential for debugging).
 * 2. Determine Status Code (default to 500).
 * 3. Handle specific error types (Prisma, JWT, Validation).
 * 4. Send JSON response (hide stack trace in production).
 */
export const errorHandler = (err, req, res, next) => {
  // 1. Log Error
  console.error('❌ Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // 2. Handle Specific Errors
  
  // Prisma: Unique constraint violation (e.g., duplicate email)
  if (err.code === 'P2002') {
    statusCode = 409;
    message = 'A record with this value already exists';
  } 
  // Prisma: Record not found
  else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found';
  }

  // JWT: Invalid or Expired
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Validation (express-validator)
  if (err.name === 'ValidationError') {
    statusCode = 400;
  }

  // 3. Send Response
  res.status(statusCode).json({
    error: message,
    // Security: Only show stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * 404 Not Found handler
 * 
 * LEARNING: This runs when no route matches the request
 * Must be added AFTER all other routes
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
};

/**
 * LEARNING: How to use error handling in routes:
 * 
 * METHOD 1 - Async/Await with try-catch:
 * router.get('/users', async (req, res, next) => {
 *   try {
 *     const users = await prisma.user.findMany();
 *     res.json(users);
 *   } catch (error) {
 *     next(error); // Pass error to error handler
 *   }
 * });
 * 
 * METHOD 2 - Using asyncHandler wrapper (cleaner):
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await prisma.user.findMany();
 *   res.json(users);
 * }));
 * 
 * METHOD 3 - Throwing custom errors:
 * if (!user) {
 *   const error = new Error('User not found');
 *   error.statusCode = 404;
 *   throw error;
 * }
 */

/**
 * LEARNING: Async handler wrapper (prevents try-catch repetition)
 * 
 * BEFORE:
 * router.get('/route', async (req, res, next) => {
 *   try {
 *     // logic
 *   } catch (error) {
 *     next(error);
 *   }
 * });
 * 
 * AFTER:
 * router.get('/route', asyncHandler(async (req, res) => {
 *   // logic (errors automatically caught!)
 * }));
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

