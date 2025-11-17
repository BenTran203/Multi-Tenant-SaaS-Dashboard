/**
 * ERROR HANDLING MIDDLEWARE
 * 
 * LEARNING: This is a special middleware that catches errors from anywhere in your app
 * It must have 4 parameters: (err, req, res, next)
 * 
 * WHY?
 * - Centralizes error handling (don't repeat try-catch everywhere)
 * - Consistent error responses
 * - Logging errors in one place
 * - Hides sensitive error details in production
 * 
 * HOW IT WORKS:
 * Any route can throw an error or call next(error)
 * Express automatically sends it to this middleware
 */

/**
 * Global error handler
 * 
 * LEARNING: This catches all errors and sends a proper response
 * 
 * @param {Error} err - The error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Next middleware function
 */
export const errorHandler = (err, req, res, next) => {
  // LEARNING: Log the error for debugging
  console.error('❌ Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // LEARNING: Different types of errors should return different status codes
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // LEARNING: Handle specific error types
  
  // Prisma errors (database errors)
  if (err.code === 'P2002') {
    // Unique constraint violation (e.g., email already exists)
    statusCode = 409;
    message = 'A record with this value already exists';
  } else if (err.code === 'P2025') {
    // Record not found
    statusCode = 404;
    message = 'Record not found';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Validation errors (from express-validator)
  if (err.name === 'ValidationError') {
    statusCode = 400;
  }

  // LEARNING: Send error response
  res.status(statusCode).json({
    error: message,
    // LEARNING: Only send stack trace in development (security!)
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

