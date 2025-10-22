/**
 * Request caching middleware
 */

const NodeCache = require('node-cache');

// Create cache instance
const cache = new NodeCache({
  stdTTL: 300, // Default TTL: 5 minutes
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false // Don't clone objects for better performance
});

// Cache middleware
const cacheMiddleware = (ttl = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Generate cache key from request
    const cacheKey = generateCacheKey(req);
    
    // Check if data exists in cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      // Set cache headers
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-TTL', ttl);
      
      return res.json(cachedData);
    }
    
    // Store original send function
    const originalSend = res.send;
    
    // Override send function to cache response
    res.send = function(data) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
          cache.set(cacheKey, parsedData, ttl);
          
          // Set cache headers
          res.setHeader('X-Cache', 'MISS');
          res.setHeader('X-Cache-TTL', ttl);
        } catch (error) {
          // If parsing fails, don't cache
          console.warn('Failed to cache response:', error.message);
        }
      }
      
      // Call original send function
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Generate cache key from request
const generateCacheKey = (req) => {
  const baseKey = `${req.method}:${req.originalUrl}`;
  const queryString = req.query ? JSON.stringify(req.query) : '';
  const user = req.user ? req.user.id : 'anonymous';
  
  return `${baseKey}:${queryString}:${user}`;
};

// Clear cache for specific pattern
const clearCache = (pattern) => {
  const keys = cache.keys();
  const regex = new RegExp(pattern);
  
  keys.forEach(key => {
    if (regex.test(key)) {
      cache.del(key);
    }
  });
};

// Clear all cache
const clearAllCache = () => {
  cache.flushAll();
};

// Cache statistics
const getCacheStats = () => {
  return cache.getStats();
};

// Cache middleware for different endpoints
const cacheByEndpoint = (req, res, next) => {
  let ttl = 300; // Default 5 minutes
  
  // Set different TTL based on endpoint
  if (req.path.includes('/stats') || req.path.includes('/analytics')) {
    ttl = 600; // 10 minutes for statistics
  } else if (req.path.includes('/patients') || req.path.includes('/appointments')) {
    ttl = 180; // 3 minutes for patient/appointment data
  } else if (req.path.includes('/auth')) {
    ttl = 60; // 1 minute for auth data
  }
  
  return cacheMiddleware(ttl)(req, res, next);
};

// Cache invalidation middleware
const invalidateCache = (patterns) => {
  return (req, res, next) => {
    // Store original send function
    const originalSend = res.send;
    
    // Override send function to invalidate cache
    res.send = function(data) {
      // Only invalidate on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach(pattern => {
          clearCache(pattern);
        });
      }
      
      // Call original send function
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  cacheMiddleware,
  cacheByEndpoint,
  invalidateCache,
  clearCache,
  clearAllCache,
  getCacheStats,
  cache
};