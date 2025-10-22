/**
 * Request throttling middleware
 */

const { sendError } = require('../utils/response');

// Throttle store to track requests
const throttleStore = new Map();

// Throttle middleware
const throttle = (windowMs = 60000, maxRequests = 100, keyGenerator = null) => {
  return (req, res, next) => {
    const now = Date.now();
    const key = keyGenerator ? keyGenerator(req) : req.ip;
    
    // Get or create throttle data for this key
    let throttleData = throttleStore.get(key);
    if (!throttleData) {
      throttleData = {
        requests: [],
        blocked: false,
        blockUntil: 0
      };
      throttleStore.set(key, throttleData);
    }
    
    // Check if key is currently blocked
    if (throttleData.blocked && now < throttleData.blockUntil) {
      const remainingTime = Math.ceil((throttleData.blockUntil - now) / 1000);
      return sendError(res, `Too many requests. Try again in ${remainingTime} seconds.`, null, 429);
    }
    
    // Remove old requests outside the window
    throttleData.requests = throttleData.requests.filter(time => now - time < windowMs);
    
    // Check if limit is exceeded
    if (throttleData.requests.length >= maxRequests) {
      // Block the key for the window duration
      throttleData.blocked = true;
      throttleData.blockUntil = now + windowMs;
      
      return sendError(res, `Too many requests. Try again in ${Math.ceil(windowMs / 1000)} seconds.`, null, 429);
    }
    
    // Add current request
    throttleData.requests.push(now);
    
    // Reset block status if window has passed
    if (throttleData.blocked && now >= throttleData.blockUntil) {
      throttleData.blocked = false;
      throttleData.blockUntil = 0;
    }
    
    next();
  };
};

// IP-based throttling
const ipThrottle = (windowMs = 60000, maxRequests = 100) => {
  return throttle(windowMs, maxRequests, (req) => req.ip);
};

// User-based throttling
const userThrottle = (windowMs = 60000, maxRequests = 100) => {
  return throttle(windowMs, maxRequests, (req) => req.user?.id || req.ip);
};

// Endpoint-based throttling
const endpointThrottle = (windowMs = 60000, maxRequests = 100) => {
  return throttle(windowMs, maxRequests, (req) => `${req.method}:${req.path}`);
};

// Different throttling rules for different endpoints
const adaptiveThrottle = (req, res, next) => {
  let windowMs = 60000; // 1 minute
  let maxRequests = 100;
  
  // Adjust throttling based on endpoint
  if (req.path.includes('/auth')) {
    windowMs = 300000; // 5 minutes
    maxRequests = 5; // 5 attempts per 5 minutes
  } else if (req.path.includes('/upload')) {
    windowMs = 300000; // 5 minutes
    maxRequests = 10; // 10 uploads per 5 minutes
  } else if (req.path.includes('/search')) {
    windowMs = 60000; // 1 minute
    maxRequests = 50; // 50 searches per minute
  } else if (req.path.includes('/api/')) {
    windowMs = 60000; // 1 minute
    maxRequests = 100; // 100 requests per minute
  }
  
  return throttle(windowMs, maxRequests, (req) => req.ip)(req, res, next);
};

// Cleanup expired throttle data
const cleanupThrottleData = () => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [key, data] of throttleStore.entries()) {
    if (now - Math.max(...data.requests) > maxAge) {
      throttleStore.delete(key);
    }
  }
};

// Run cleanup every hour
setInterval(cleanupThrottleData, 60 * 60 * 1000);

// Get throttle statistics
const getThrottleStats = () => {
  const now = Date.now();
  const stats = {
    totalKeys: throttleStore.size,
    blockedKeys: 0,
    activeKeys: 0,
    totalRequests: 0
  };
  
  for (const [key, data] of throttleStore.entries()) {
    stats.totalRequests += data.requests.length;
    
    if (data.blocked && now < data.blockUntil) {
      stats.blockedKeys++;
    } else {
      stats.activeKeys++;
    }
  }
  
  return stats;
};

// Reset throttle data for a specific key
const resetThrottleKey = (key) => {
  throttleStore.delete(key);
};

// Reset all throttle data
const resetAllThrottleData = () => {
  throttleStore.clear();
};

module.exports = {
  throttle,
  ipThrottle,
  userThrottle,
  endpointThrottle,
  adaptiveThrottle,
  getThrottleStats,
  resetThrottleKey,
  resetAllThrottleData
};