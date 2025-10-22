/**
 * Request monitoring middleware
 */

const fs = require('fs');
const path = require('path');

// Create monitoring directory if it doesn't exist
const monitoringDir = path.join(__dirname, '../monitoring');
if (!fs.existsSync(monitoringDir)) {
  fs.mkdirSync(monitoringDir, { recursive: true });
}

// Request metrics
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  averageResponseTime: 0,
  responseTimes: [],
  errorCounts: {},
  endpointCounts: {},
  statusCodes: {}
};

// Update metrics
const updateMetrics = (req, res, responseTime) => {
  metrics.totalRequests++;
  
  if (res.statusCode >= 200 && res.statusCode < 400) {
    metrics.successfulRequests++;
  } else {
    metrics.failedRequests++;
  }
  
  // Update response times
  metrics.responseTimes.push(responseTime);
  if (metrics.responseTimes.length > 1000) {
    metrics.responseTimes = metrics.responseTimes.slice(-1000); // Keep only last 1000
  }
  
  // Calculate average response time
  metrics.averageResponseTime = metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length;
  
  // Update endpoint counts
  const endpoint = `${req.method} ${req.route?.path || req.path}`;
  metrics.endpointCounts[endpoint] = (metrics.endpointCounts[endpoint] || 0) + 1;
  
  // Update status code counts
  metrics.statusCodes[res.statusCode] = (metrics.statusCodes[res.statusCode] || 0) + 1;
  
  // Update error counts
  if (res.statusCode >= 400) {
    const errorType = `${res.statusCode}`;
    metrics.errorCounts[errorType] = (metrics.errorCounts[errorType] || 0) + 1;
  }
};

// Request monitoring middleware
const requestMonitoring = (req, res, next) => {
  const startTime = Date.now();
  
  // Store original send function
  const originalSend = res.send;
  
  // Override send function to capture metrics
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    updateMetrics(req, res, responseTime);
    
    // Call original send function
    originalSend.call(this, data);
  };
  
  next();
};

// Performance monitoring middleware
const performanceMonitoring = (req, res, next) => {
  const startTime = process.hrtime();
  
  // Store original send function
  const originalSend = res.send;
  
  // Override send function to capture performance metrics
  res.send = function(data) {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const responseTime = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds
    
    // Log slow requests
    if (responseTime > 1000) { // More than 1 second
      console.warn(`Slow request detected: ${req.method} ${req.path} took ${responseTime.toFixed(2)}ms`);
    }
    
    // Call original send function
    originalSend.call(this, data);
  };
  
  next();
};

// Memory monitoring
const memoryMonitoring = () => {
  const memUsage = process.memoryUsage();
  const memInfo = {
    timestamp: new Date().toISOString(),
    rss: Math.round(memUsage.rss / 1024 / 1024), // MB
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
    external: Math.round(memUsage.external / 1024 / 1024), // MB
    arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024) // MB
  };
  
  // Log memory usage every 5 minutes
  setInterval(() => {
    console.log('Memory Usage:', memInfo);
  }, 5 * 60 * 1000);
  
  return memInfo;
};

// Get current metrics
const getMetrics = () => {
  return {
    ...metrics,
    memoryUsage: memoryMonitoring(),
    timestamp: new Date().toISOString()
  };
};

// Reset metrics
const resetMetrics = () => {
  metrics.totalRequests = 0;
  metrics.successfulRequests = 0;
  metrics.failedRequests = 0;
  metrics.averageResponseTime = 0;
  metrics.responseTimes = [];
  metrics.errorCounts = {};
  metrics.endpointCounts = {};
  metrics.statusCodes = {};
};

// Export metrics to file
const exportMetrics = () => {
  const metricsData = getMetrics();
  const filename = `metrics-${new Date().toISOString().split('T')[0]}.json`;
  const filepath = path.join(monitoringDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(metricsData, null, 2));
  console.log(`Metrics exported to ${filepath}`);
};

// Health check endpoint data
const getHealthCheck = () => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.round(uptime),
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024)
    },
    metrics: {
      totalRequests: metrics.totalRequests,
      successfulRequests: metrics.successfulRequests,
      failedRequests: metrics.failedRequests,
      averageResponseTime: Math.round(metrics.averageResponseTime)
    }
  };
};

module.exports = {
  requestMonitoring,
  performanceMonitoring,
  memoryMonitoring,
  getMetrics,
  resetMetrics,
  exportMetrics,
  getHealthCheck
};