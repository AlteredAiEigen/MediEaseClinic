/**
 * Pagination middleware
 */

const { query } = require('express-validator');
const { sendError } = require('../utils/response');

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isString()
    .withMessage('Sort must be a string'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be either "asc" or "desc"')
];

// Pagination middleware
const pagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sort = req.query.sort || 'createdAt';
  const order = req.query.order || 'desc';
  
  // Calculate skip value
  const skip = (page - 1) * limit;
  
  // Add pagination info to request
  req.pagination = {
    page,
    limit,
    skip,
    sort,
    order
  };
  
  next();
};

// Add pagination metadata to response
const addPaginationMeta = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Only add pagination meta for successful responses with data
    if (res.statusCode >= 200 && res.statusCode < 300 && data) {
      try {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        
        if (parsedData && parsedData.data && Array.isArray(parsedData.data)) {
          const { page, limit } = req.pagination;
          const total = parsedData.total || parsedData.data.length;
          const totalPages = Math.ceil(total / limit);
          
          parsedData.pagination = {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          };
          
          return originalSend.call(this, JSON.stringify(parsedData));
        }
      } catch (error) {
        // If parsing fails, send original data
        return originalSend.call(this, data);
      }
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Search middleware
const search = (req, res, next) => {
  const searchQuery = req.query.search;
  const searchFields = req.query.searchFields;
  
  if (searchQuery) {
    req.search = {
      query: searchQuery,
      fields: searchFields ? searchFields.split(',') : []
    };
  }
  
  next();
};

// Filter middleware
const filter = (req, res, next) => {
  const filters = {};
  
  // Extract filter parameters from query
  Object.keys(req.query).forEach(key => {
    if (key.startsWith('filter_')) {
      const filterKey = key.replace('filter_', '');
      filters[filterKey] = req.query[key];
    }
  });
  
  if (Object.keys(filters).length > 0) {
    req.filters = filters;
  }
  
  next();
};

module.exports = {
  validatePagination,
  pagination,
  addPaginationMeta,
  search,
  filter
};
