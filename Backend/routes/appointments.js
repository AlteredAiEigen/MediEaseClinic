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
const { pagination, addPaginationMeta } = require('../middleware/pagination');

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier
 *         appointmentId:
 *           type: string
 *           description: Auto-generated appointment ID (e.g., APT00123456)
 *         patient:
 *           type: string
 *           description: Patient ID
 *         doctor:
 *           type: string
 *           description: Doctor ID
 *         scheduledBy:
 *           type: string
 *           description: User who scheduled the appointment
 *         date:
 *           type: string
 *           format: date
 *           description: Appointment date (YYYY-MM-DD)
 *         time:
 *           type: string
 *           description: Appointment time (HH:MM)
 *         duration:
 *           type: integer
 *           minimum: 15
 *           maximum: 480
 *           description: Duration in minutes
 *         status:
 *           type: string
 *           enum: [scheduled, checked-in, in-progress, completed, cancelled, no-show]
 *           description: Appointment status
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           description: Appointment priority
 *         reason:
 *           type: string
 *           maxLength: 500
 *           description: Reason for appointment
 *         notes:
 *           type: string
 *           maxLength: 1000
 *           description: Additional notes
 *         presentInClinic:
 *           type: boolean
 *           description: Whether patient is present in clinic
 *         insurance:
 *           type: boolean
 *           description: Whether insurance is involved
 *         patientName:
 *           type: string
 *           description: Patient's full name (populated field)
 *         doctorName:
 *           type: string
 *           description: Doctor's full name (populated field)
 *         scheduledByName:
 *           type: string
 *           description: Scheduler's full name (populated field)
 *         checkedInAt:
 *           type: string
 *           format: date-time
 *           description: Check-in timestamp
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: Appointment start timestamp
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: Appointment completion timestamp
 *         cancelledAt:
 *           type: string
 *           format: date-time
 *           description: Cancellation timestamp
 *         cancellationReason:
 *           type: string
 *           description: Reason for cancellation
 *         followUpRequired:
 *           type: boolean
 *           description: Whether follow-up is required
 *         followUpDate:
 *           type: string
 *           format: date
 *           description: Follow-up date
 *         followUpNotes:
 *           type: string
 *           description: Follow-up notes
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     AppointmentCreateRequest:
 *       type: object
 *       required:
 *         - patient
 *         - doctor
 *         - date
 *         - time
 *         - reason
 *       properties:
 *         patient:
 *           type: string
 *           description: Patient ID
 *         doctor:
 *           type: string
 *           description: Doctor ID
 *         date:
 *           type: string
 *           format: date
 *           description: Appointment date (YYYY-MM-DD)
 *         time:
 *           type: string
 *           description: Appointment time (HH:MM)
 *         duration:
 *           type: integer
 *           minimum: 15
 *           maximum: 480
 *           default: 30
 *           description: Duration in minutes
 *         reason:
 *           type: string
 *           minLength: 1
 *           maxLength: 500
 *           description: Reason for appointment
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           default: medium
 *           description: Appointment priority
 *         notes:
 *           type: string
 *           maxLength: 1000
 *           description: Additional notes
 *
 *     AppointmentUpdateRequest:
 *       type: object
 *       properties:
 *         doctor:
 *           type: string
 *           description: Doctor ID
 *         date:
 *           type: string
 *           format: date
 *           description: Appointment date (YYYY-MM-DD)
 *         time:
 *           type: string
 *           description: Appointment time (HH:MM)
 *         duration:
 *           type: integer
 *           minimum: 15
 *           maximum: 480
 *           description: Duration in minutes
 *         reason:
 *           type: string
 *           maxLength: 500
 *           description: Reason for appointment
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           description: Appointment priority
 *         notes:
 *           type: string
 *           maxLength: 1000
 *           description: Additional notes
 *         status:
 *           type: string
 *           enum: [scheduled, checked-in, in-progress, completed, cancelled, no-show]
 *           description: Appointment status
 *
 *     AppointmentStats:
 *       type: object
 *       properties:
 *         totalAppointments:
 *           type: integer
 *           description: Total number of appointments
 *         appointmentsToday:
 *           type: integer
 *           description: Appointments scheduled for today
 *         completedToday:
 *           type: integer
 *           description: Appointments completed today
 *         pendingToday:
 *           type: integer
 *           description: Pending appointments for today
 *         cancelledThisMonth:
 *           type: integer
 *           description: Appointments cancelled this month
 *         averageDuration:
 *           type: number
 *           description: Average appointment duration in minutes
 *         busiestDay:
 *           type: string
 *           format: date
 *           description: Day with most appointments
 *
 *     DoctorAvailability:
 *       type: object
 *       properties:
 *         doctorId:
 *           type: string
 *           description: Doctor ID
 *         date:
 *           type: string
 *           format: date
 *           description: Date for availability check
 *         startTime:
 *           type: string
 *           description: Clinic start time
 *         endTime:
 *           type: string
 *           description: Clinic end time
 *         isAvailable:
 *           type: boolean
 *           description: Whether doctor has any availability
 *         timeSlots:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               time:
 *                 type: string
 *                 description: Time slot (HH:MM)
 *               available:
 *                 type: boolean
 *                 description: Whether slot is available
 *               appointmentId:
 *                 type: string
 *                 nullable: true
 *                 description: Existing appointment ID if slot is booked
 */

const router = express.Router();

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Get all appointments
 *     description: Retrieve a paginated list of appointments with optional filtering by doctor, patient, status, date range, etc.
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of appointments per page
 *       - in: query
 *         name: doctor
 *         schema:
 *           type: string
 *         description: Filter by doctor ID
 *       - in: query
 *         name: patient
 *         schema:
 *           type: string
 *         description: Filter by patient ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, checked-in, in-progress, completed, cancelled, no-show]
 *         description: Filter by appointment status
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by specific date (YYYY-MM-DD)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for date range filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for date range filter
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   description: Number of appointments in current page
 *                 total:
 *                   type: integer
 *                   description: Total number of appointments
 *                 data:
 *                   type: object
 *                   properties:
 *                     appointments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Appointment'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/', protect, pagination, addPaginationMeta, getAppointments);

/**
 * @swagger
 * /api/appointments/stats:
 *   get:
 *     summary: Get appointment statistics
 *     description: Retrieve comprehensive statistics about appointments
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AppointmentStats'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Create a new appointment
 *     description: Schedule a new appointment for a patient with a doctor
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppointmentCreateRequest'
 *           example:
 *             patient: "60d5ecb74b24c72b8c8b4567"
 *             doctor: "60d5ecb74b24c72b8c8b4568"
 *             date: "2024-12-31"
 *             time: "10:00"
 *             duration: 30
 *             reason: "Regular checkup"
 *             priority: "medium"
 *             notes: "Patient requested morning appointment"
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Appointment created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     appointment:
 *                       $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Validation error or time slot conflict
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (requires receptionist or admin role)
 *       500:
 *         description: Server error
 */
router.post('/', protect, authorize('receptionist', 'admin'), createAppointment);

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
