/**
 * CORS middleware configuration
 */

const cors = require('cors');

// Get allowed origins from environment variable
const getAllowedOrigins = () => {
  const origins = process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:8081';
  return origins.split(',').map(origin => origin.trim());
};

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = getAllowedOrigins();
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 hours
};

// Create CORS middleware
const corsMiddleware = cors(corsOptions);

// Error handler for CORS
const corsErrorHandler = (err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation: Origin not allowed',
      error: 'The origin of your request is not allowed by the CORS policy.'
    });
  }
  next(err);
};

module.exports = {
  corsMiddleware,
  corsErrorHandler
};
