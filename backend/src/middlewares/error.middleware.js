import { StatusCodes } from 'http-status-codes';
import { ValidationError } from 'sequelize';
import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  // Default error structure
  let error = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message || 'Something went wrong',
    errors: err.errors || [],
    stack: process.env.NODE_ENV === 'development' ? err.stack : {},
  };

  // Handle validation errors
  if (err instanceof ValidationError) {
    error.statusCode = StatusCodes.BAD_REQUEST;
    error.message = 'Validation Error';
    error.errors = err.errors.map(e => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.statusCode = StatusCodes.UNAUTHORIZED;
    error.message = 'Invalid token';
  }

  // Handle rate limit errors
  if (err.statusCode === 429) {
    error.message = 'Too many requests, please try again later';
  }

  // Log the error
  logger.error({
    message: err.message,
    statusCode: error.statusCode,
    stack: error.stack,
  });

  // Send error response
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors.length ? error.errors : undefined,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

// 404 Not Found middleware
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(StatusCodes.NOT_FOUND);
  next(error);
};
