const express = require('express');
const {
  getDashboardStats,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getSystemStats,
  getPatients,
  getAppointments,
  getClinicalNotes,
  getRecordings
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardStats:
 *       type: object
 *       properties:
 *         totalPatients:
 *           type: integer
 *           description: Total number of patients in the system
 *         totalAppointments:
 *           type: integer
 *           description: Total number of appointments
 *         totalDoctors:
 *           type: integer
 *           description: Total number of doctors
 *         totalReceptionists:
 *           type: integer
 *           description: Total number of receptionists
 *         totalClinicalNotes:
 *           type: integer
 *           description: Total number of clinical notes
 *         totalRecordings:
 *           type: integer
 *           description: Total number of recordings
 *         appointmentsToday:
 *           type: integer
 *           description: Appointments scheduled for today
 *         patientsThisMonth:
 *           type: integer
 *           description: New patients registered this month
 *         recentActivity:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [appointment, patient]
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               user:
 *                 type: string
 *
 *     SystemStats:
 *       type: object
 *       properties:
 *         totalUsers:
 *           type: integer
 *           description: Total number of users
 *         activeUsers:
 *           type: integer
 *           description: Number of active users
 *         totalPatients:
 *           type: integer
 *           description: Total number of patients
 *         totalAppointments:
 *           type: integer
 *           description: Total number of appointments
 *         totalClinicalNotes:
 *           type: integer
 *           description: Total number of clinical notes
 *         totalRecordings:
 *           type: integer
 *           description: Total number of recordings
 *         systemUptime:
 *           type: number
 *           description: System uptime in hours
 *         databaseSize:
 *           type: string
 *           description: Database size
 *         apiRequestsToday:
 *           type: integer
 *           description: API requests made today
 *         errorRate:
 *           type: number
 *           description: Error rate percentage
 *
 *     UserCreateRequest:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *         - role
 *       properties:
 *         firstName:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *         lastName:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *         role:
 *           type: string
 *           enum: [admin, doctor, receptionist]
 *         phone:
 *           type: string
 *         speciality:
 *           type: string
 *           maxLength: 100
 *         licenseNumber:
 *           type: string
 *           maxLength: 50
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *             enum: [manage_users, manage_appointments, view_reports, manage_settings]
 *
 *     UserUpdateRequest:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           maxLength: 50
 *         lastName:
 *           type: string
 *           maxLength: 50
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         speciality:
 *           type: string
 *           maxLength: 100
 *         licenseNumber:
 *           type: string
 *           maxLength: 50
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *             enum: [manage_users, manage_appointments, view_reports, manage_settings]
 *         isActive:
 *           type: boolean
 */

const router = express.Router();

// All admin routes require admin role
router.use(protect);
router.use(authorize('admin'));

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     description: Retrieve comprehensive dashboard statistics for admin overview
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DashboardStats'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (requires admin role)
 *       500:
 *         description: Server error
 */
router.get('/dashboard', getDashboardStats);

// @route   GET /api/admin/stats
// @desc    Get system statistics
// @access  Private (Admin)
router.get('/stats', getSystemStats);

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', getUsers);

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user account (admin, doctor, or receptionist)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserCreateRequest'
 *           example:
 *             firstName: "John"
 *             lastName: "Smith"
 *             email: "john.smith@medieaseclinic.com"
 *             password: "SecurePass123"
 *             role: "doctor"
 *             phone: "+1234567890"
 *             speciality: "Cardiology"
 *             licenseNumber: "DOC123456"
 *             permissions: ["manage_appointments", "view_reports"]
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                   example: "User created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or user with email already exists
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (requires admin role)
 *       500:
 *         description: Server error
 */
router.post('/users', createUser);

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private (Admin)
router.put('/users/:id', updateUser);

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (Admin)
router.delete('/users/:id', deleteUser);

// @route   GET /api/admin/patients
// @desc    Get all patients
// @access  Private (Admin)
router.get('/patients', getPatients);

// @route   GET /api/admin/appointments
// @desc    Get all appointments
// @access  Private (Admin)
router.get('/appointments', getAppointments);

// @route   GET /api/admin/clinical-notes
// @desc    Get all clinical notes
// @access  Private (Admin)
router.get('/clinical-notes', getClinicalNotes);

// @route   GET /api/admin/recordings
// @desc    Get all recordings
// @access  Private (Admin)
router.get('/recordings', getRecordings);

module.exports = router;
