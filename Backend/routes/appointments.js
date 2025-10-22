const express = require('express');
const { body, query } = require('express-validator');
const {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  getDoctorAvailability,
  getAppointmentsByDateRange,
  getAppointmentStats
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/appointments
// @desc    Get all appointments
// @access  Private
router.get('/', protect, getAppointments);

// @route   GET /api/appointments/stats
// @desc    Get appointment statistics
// @access  Private
router.get('/stats', protect, getAppointmentStats);

// @route   GET /api/appointments/availability/:doctorId
// @desc    Get doctor availability
// @access  Private
router.get('/availability/:doctorId', protect, getDoctorAvailability);

// @route   GET /api/appointments/date-range
// @desc    Get appointments by date range
// @access  Private
router.get('/date-range', protect, getAppointmentsByDateRange);

// @route   GET /api/appointments/:id
// @desc    Get single appointment
// @access  Private
router.get('/:id', protect, getAppointment);

// @route   POST /api/appointments
// @desc    Create new appointment
// @access  Private (Receptionist, Admin)
router.post('/', protect, authorize('receptionist', 'admin'), [
  body('patient')
    .isMongoId()
    .withMessage('Valid patient ID is required'),
  body('doctor')
    .isMongoId()
    .withMessage('Valid doctor ID is required'),
  body('date')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format'),
  body('time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time must be in HH:MM format'),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
], createAppointment);

// @route   PUT /api/appointments/:id
// @desc    Update appointment
// @access  Private
router.put('/:id', protect, [
  body('doctor')
    .optional()
    .isMongoId()
    .withMessage('Valid doctor ID is required'),
  body('date')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format'),
  body('time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time must be in HH:MM format'),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  body('status')
    .optional()
    .isIn(['scheduled', 'checked-in', 'in-progress', 'completed', 'cancelled', 'no-show'])
    .withMessage('Invalid status')
], updateAppointment);

// @route   PUT /api/appointments/:id/status
// @desc    Update appointment status
// @access  Private
router.put('/:id/status', protect, [
  body('status')
    .isIn(['scheduled', 'checked-in', 'in-progress', 'completed', 'cancelled', 'no-show'])
    .withMessage('Status must be scheduled, checked-in, in-progress, completed, cancelled, or no-show')
], updateAppointmentStatus);

// @route   DELETE /api/appointments/:id
// @desc    Delete appointment
// @access  Private (Admin, Receptionist)
router.delete('/:id', protect, authorize('admin', 'receptionist'), deleteAppointment);

module.exports = router;
