/**
 * Request sanitization middleware
 */

const { body, query, param } = require('express-validator');
const { sanitizeString } = require('../utils/validation');

// Sanitize request body
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  next();
};

// Sanitize query parameters
const sanitizeQuery = (req, res, next) => {
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }
  next();
};

// Sanitize URL parameters
const sanitizeParams = (req, res, next) => {
  if (req.params && typeof req.params === 'object') {
    sanitizeObject(req.params);
  }
  next();
};

// Recursively sanitize object properties
const sanitizeObject = (obj) => {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'string') {
        obj[key] = sanitizeString(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  }
};

// Remove potentially dangerous characters
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/script/gi, '') // Remove script tags
    .trim();
};

// Sanitize specific fields
const sanitizeFields = (fields) => {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      fields.forEach(field => {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = sanitizeInput(req.body[field]);
        }
      });
    }
    next();
  };
};

// Remove empty strings and null values
const removeEmptyValues = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = removeEmptyFromObject(req.body);
  }
  next();
};

// Recursively remove empty values from object
const removeEmptyFromObject = (obj) => {
  const cleaned = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'object' && !Array.isArray(value)) {
          const cleanedValue = removeEmptyFromObject(value);
          if (Object.keys(cleanedValue).length > 0) {
            cleaned[key] = cleanedValue;
          }
        } else if (Array.isArray(value)) {
          const cleanedArray = value.filter(item => 
            item !== null && item !== undefined && item !== ''
          );
          if (cleanedArray.length > 0) {
            cleaned[key] = cleanedArray;
          }
        } else {
          cleaned[key] = value;
        }
      }
    }
  }
  
  return cleaned;
};

// Validate and sanitize file uploads
const sanitizeFileUploads = (req, res, next) => {
  if (req.files) {
    // Ensure files is an array
    if (!Array.isArray(req.files)) {
      req.files = [req.files];
    }
    
    // Validate file types and sizes
    req.files.forEach(file => {
      if (file.originalname) {
        file.originalname = sanitizeString(file.originalname);
      }
    });
  }
  next();
};

module.exports = {
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeFields,
  removeEmptyValues,
  sanitizeFileUploads,
  sanitizeInput
};