const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is valid but user no longer exists.'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated.'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please authenticate first.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
      });
    }

    next();
  };
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

// Check if user is doctor
const isDoctor = (req, res, next) => {
  if (req.user && req.user.role === 'doctor') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Doctor privileges required.'
    });
  }
};

// Check if user is receptionist
const isReceptionist = (req, res, next) => {
  if (req.user && req.user.role === 'receptionist') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Receptionist privileges required.'
    });
  }
};

// Check if user is doctor or admin
const isDoctorOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'doctor' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Doctor or Admin privileges required.'
    });
  }
};

// Check if user can access patient data
const canAccessPatient = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please authenticate first.'
    });
  }

  // Admin can access all patients
  if (req.user.role === 'admin') {
    return next();
  }

  // Doctor can access patients they have appointments with
  if (req.user.role === 'doctor') {
    // This would need to be checked against appointments
    // For now, allow access
    return next();
  }

  // Receptionist can access all patients for scheduling
  if (req.user.role === 'receptionist') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. Insufficient privileges to access patient data.'
  });
};

module.exports = {
  protect,
  authorize,
  isAdmin,
  isDoctor,
  isReceptionist,
  isDoctorOrAdmin,
  canAccessPatient
};
