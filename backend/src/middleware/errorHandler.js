/**
 * ============================================================================
 * ERROR HANDLING MIDDLEWARE
 * ============================================================================

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


export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Page not found',
    path: req.path,
    method: req.method
  });
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

