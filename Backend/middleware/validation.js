/**
 * Request validation middleware
 */

const { body, param, query, validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

// Common validation rules
const commonValidations = {
  // ObjectId validation
  objectId: (field) => param(field).isMongoId().withMessage('Invalid ID format'),
  
  // Email validation
  email: (field) => body(field).isEmail().normalizeEmail().withMessage('Invalid email format'),
  
  // Password validation
  password: (field) => body(field)
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  // Phone validation
  phone: (field) => body(field)
    .isMobilePhone()
    .withMessage('Invalid phone number format'),
  
  // Date validation
  date: (field) => body(field)
    .isISO8601()
    .withMessage('Invalid date format. Use ISO 8601 format (YYYY-MM-DD)'),
  
  // Required field validation
  required: (field) => body(field).notEmpty().withMessage(`${field} is required`),
  
  // String length validation
  stringLength: (field, min = 1, max = 255) => body(field)
    .isLength({ min, max })
    .withMessage(`${field} must be between ${min} and ${max} characters`),
  
  // Numeric validation
  numeric: (field) => body(field)
    .isNumeric()
    .withMessage(`${field} must be a number`),
  
  // Positive number validation
  positiveNumber: (field) => body(field)
    .isFloat({ min: 0 })
    .withMessage(`${field} must be a positive number`),
  
  // Enum validation
  enum: (field, values) => body(field)
    .isIn(values)
    .withMessage(`${field} must be one of: ${values.join(', ')}`),
  
  // Array validation
  array: (field) => body(field)
    .isArray()
    .withMessage(`${field} must be an array`),
  
  // Boolean validation
  boolean: (field) => body(field)
    .isBoolean()
    .withMessage(`${field} must be a boolean value`)
};

// Patient validation rules
const patientValidations = {
  create: [
    commonValidations.required('firstName'),
    commonValidations.stringLength('firstName', 1, 50),
    commonValidations.required('lastName'),
    commonValidations.stringLength('lastName', 1, 50),
    commonValidations.required('dateOfBirth'),
    commonValidations.date('dateOfBirth'),
    commonValidations.required('gender'),
    commonValidations.enum('gender', ['male', 'female', 'other']),
    commonValidations.required('phone'),
    commonValidations.phone('phone'),
    commonValidations.email('email').optional(),
    commonValidations.stringLength('address', 1, 255).optional(),
    commonValidations.stringLength('emergencyContact', 1, 100).optional(),
    commonValidations.phone('emergencyPhone').optional()
  ],
  
  update: [
    commonValidations.objectId('id'),
    commonValidations.stringLength('firstName', 1, 50).optional(),
    commonValidations.stringLength('lastName', 1, 50).optional(),
    commonValidations.date('dateOfBirth').optional(),
    commonValidations.enum('gender', ['male', 'female', 'other']).optional(),
    commonValidations.phone('phone').optional(),
    commonValidations.email('email').optional(),
    commonValidations.stringLength('address', 1, 255).optional(),
    commonValidations.stringLength('emergencyContact', 1, 100).optional(),
    commonValidations.phone('emergencyPhone').optional()
  ]
};

// Appointment validation rules
const appointmentValidations = {
  create: [
    commonValidations.required('patientId'),
    commonValidations.objectId('patientId'),
    commonValidations.required('doctorId'),
    commonValidations.objectId('doctorId'),
    commonValidations.required('appointmentDate'),
    commonValidations.date('appointmentDate'),
    commonValidations.required('appointmentTime'),
    commonValidations.stringLength('appointmentTime', 1, 10),
    commonValidations.required('duration'),
    commonValidations.positiveNumber('duration'),
    commonValidations.required('type'),
    commonValidations.enum('type', ['consultation', 'follow-up', 'emergency', 'routine']),
    commonValidations.stringLength('notes', 1, 500).optional()
  ],
  
  update: [
    commonValidations.objectId('id'),
    commonValidations.objectId('patientId').optional(),
    commonValidations.objectId('doctorId').optional(),
    commonValidations.date('appointmentDate').optional(),
    commonValidations.stringLength('appointmentTime', 1, 10).optional(),
    commonValidations.positiveNumber('duration').optional(),
    commonValidations.enum('type', ['consultation', 'follow-up', 'emergency', 'routine']).optional(),
    commonValidations.stringLength('notes', 1, 500).optional()
  ]
};

// User validation rules
const userValidations = {
  register: [
    commonValidations.required('firstName'),
    commonValidations.stringLength('firstName', 1, 50),
    commonValidations.required('lastName'),
    commonValidations.stringLength('lastName', 1, 50),
    commonValidations.required('email'),
    commonValidations.email('email'),
    commonValidations.required('password'),
    commonValidations.password('password'),
    commonValidations.required('role'),
    commonValidations.enum('role', ['admin', 'doctor', 'receptionist']),
    commonValidations.required('phone'),
    commonValidations.phone('phone')
  ],
  
  login: [
    commonValidations.required('email'),
    commonValidations.email('email'),
    commonValidations.required('password'),
    commonValidations.stringLength('password', 1, 255)
  ]
};

// Clinical note validation rules
const clinicalNoteValidations = {
  create: [
    commonValidations.required('patientId'),
    commonValidations.objectId('patientId'),
    commonValidations.required('doctorId'),
    commonValidations.objectId('doctorId'),
    commonValidations.required('title'),
    commonValidations.stringLength('title', 1, 100),
    commonValidations.required('content'),
    commonValidations.stringLength('content', 1, 2000),
    commonValidations.required('category'),
    commonValidations.enum('category', ['consultation', 'diagnosis', 'treatment', 'follow-up', 'emergency']),
    commonValidations.required('priority'),
    commonValidations.enum('priority', ['low', 'medium', 'high', 'urgent']),
    commonValidations.boolean('isActionable').optional(),
    commonValidations.stringLength('actionItems', 1, 500).optional()
  ]
};

// Recording validation rules
const recordingValidations = {
  create: [
    commonValidations.required('patientId'),
    commonValidations.objectId('patientId'),
    commonValidations.required('doctorId'),
    commonValidations.objectId('doctorId'),
    commonValidations.required('duration'),
    commonValidations.positiveNumber('duration'),
    commonValidations.stringLength('transcription', 1, 5000).optional(),
    commonValidations.stringLength('notes', 1, 1000).optional()
  ]
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', errors.array());
  }
  next();
};

module.exports = {
  commonValidations,
  patientValidations,
  appointmentValidations,
  userValidations,
  clinicalNoteValidations,
  recordingValidations,
  handleValidationErrors
};