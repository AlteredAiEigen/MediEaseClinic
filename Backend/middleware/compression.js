/**
 * Compression middleware
 */

const compression = require('compression');

// Compression options
const compressionOptions = {
  // Only compress responses that are larger than 1KB
  threshold: 1024,
  
  // Compression level (1-9, where 9 is maximum compression)
  level: 6,
  
  // Filter function to determine if response should be compressed
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Use default compression filter
    return compression.filter(req, res);
  }
};

// Create compression middleware
const compressionMiddleware = compression(compressionOptions);

module.exports = {
  compressionMiddleware
};