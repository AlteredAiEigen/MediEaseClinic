/**
 * API versioning middleware
 */

const { sendError } = require('../utils/response');

// Supported API versions
const SUPPORTED_VERSIONS = ['v1'];

// Default API version
const DEFAULT_VERSION = 'v1';

// API version middleware
const apiVersioning = (req, res, next) => {
  // Extract version from URL path
  const pathParts = req.path.split('/');
  const versionIndex = pathParts.indexOf('api');
  
  if (versionIndex !== -1 && pathParts[versionIndex + 1]) {
    const version = pathParts[versionIndex + 1];
    
    // Check if version is supported
    if (SUPPORTED_VERSIONS.includes(version)) {
      req.apiVersion = version;
    } else {
      return sendError(res, `Unsupported API version: ${version}. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`, null, 400);
    }
  } else {
    // Use default version if not specified
    req.apiVersion = DEFAULT_VERSION;
  }
  
  next();
};

// Version-specific route handler
const versionRoute = (version, handler) => {
  return (req, res, next) => {
    if (req.apiVersion === version) {
      return handler(req, res, next);
    }
    next();
  };
};

// Deprecation warning middleware
const deprecationWarning = (version, deprecationDate, alternativeVersion) => {
  return (req, res, next) => {
    if (req.apiVersion === version) {
      res.setHeader('X-API-Deprecated', 'true');
      res.setHeader('X-API-Deprecation-Date', deprecationDate);
      res.setHeader('X-API-Alternative-Version', alternativeVersion);
      
      // Log deprecation warning
      console.warn(`API version ${version} is deprecated. Use ${alternativeVersion} instead.`);
    }
    next();
  };
};

module.exports = {
  apiVersioning,
  versionRoute,
  deprecationWarning,
  SUPPORTED_VERSIONS,
  DEFAULT_VERSION
};
