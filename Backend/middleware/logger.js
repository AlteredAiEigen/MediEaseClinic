/**
 * Logging middleware
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Log request details
 */
const logRequest = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  const logEntry = {
    timestamp,
    method,
    url,
    ip,
    userAgent,
    body: req.method !== 'GET' ? req.body : undefined
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${timestamp}] ${method} ${url} - ${ip}`);
  }
  
  // Log to file
  const logFile = path.join(logsDir, `${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  
  next();
};

/**
 * Log response details
 */
const logResponse = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    const timestamp = new Date().toISOString();
    const statusCode = res.statusCode;
    const responseTime = Date.now() - req.startTime;
    
    const logEntry = {
      timestamp,
      method: req.method,
      url: req.url,
      statusCode,
      responseTime: `${responseTime}ms`,
      responseSize: data ? data.length : 0
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${timestamp}] ${req.method} ${req.url} - ${statusCode} (${responseTime}ms)`);
    }
    
    // Log to file
    const logFile = path.join(logsDir, `${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Set request start time
 */
const setStartTime = (req, res, next) => {
  req.startTime = Date.now();
  next();
};

module.exports = {
  logRequest,
  logResponse,
  setStartTime
};
