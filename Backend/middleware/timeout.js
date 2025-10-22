/**
 * Request timeout middleware
 */

const { sendError } = require('../utils/response');

// Default timeout duration (30 seconds)
const DEFAULT_TIMEOUT = 30000;

// Request timeout middleware
const requestTimeout = (timeout = DEFAULT_TIMEOUT) => {
  return (req, res, next) => {
    // Set timeout for the request
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Request timeout',
          error: 'The request took too long to process'
        });
      }
    }, timeout);
    
    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timeoutId);
    });
    
    res.on('close', () => {
      clearTimeout(timeoutId);
    });
    
    next();
  };
};

// Different timeout durations for different types of requests
const timeouts = {
  // Short timeout for simple operations
  short: 5000, // 5 seconds
  
  // Medium timeout for standard operations
  medium: 15000, // 15 seconds
  
  // Long timeout for complex operations
  long: 30000, // 30 seconds
  
  // Very long timeout for file uploads and processing
  veryLong: 60000, // 60 seconds
};

// Timeout middleware for different request types
const timeoutByType = (req, res, next) => {
  let timeout = timeouts.medium; // Default timeout
  
  // Determine timeout based on request path
  if (req.path.includes('/upload') || req.path.includes('/process')) {
    timeout = timeouts.veryLong;
  } else if (req.path.includes('/search') || req.path.includes('/stats')) {
    timeout = timeouts.long;
  } else if (req.path.includes('/auth') || req.path.includes('/ping')) {
    timeout = timeouts.short;
  }
  
  return requestTimeout(timeout)(req, res, next);
};

module.exports = {
  requestTimeout,
  timeoutByType,
  timeouts
};