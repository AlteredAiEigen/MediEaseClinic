const express = require('express');
const { body } = require('express-validator');
const {
  register,
  registerAdmin,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         role:
 *           type: string
 *           enum: [admin, doctor, receptionist]
 *           description: User's role in the system
 *         phone:
 *           type: string
 *           description: User's phone number
 *         speciality:
 *           type: string
 *           description: Doctor's speciality (if role is doctor)
 *         licenseNumber:
 *           type: string
 *           description: Doctor's license number (if role is doctor)
 *         isActive:
 *           type: boolean
 *           description: Account status
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           minLength: 6
 *           description: User's password
 *
 *     RegisterRequest:
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
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             token:
 *               type: string
 *               description: JWT authentication token
 */

const router = express.Router();

/**
 * @swagger
 * /api/auth/register/admin:
 *   post:
 *     summary: Register clinic admin
 *     description: Register the initial admin account for a new clinic
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clinicName
 *               - adminEmail
 *               - adminPassword
 *             properties:
 *               clinicName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Name of the clinic
 *               adminEmail:
 *                 type: string
 *                 format: email
 *                 description: Admin email address
 *               adminPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: Admin password
 *               doctorRange:
 *                 type: string
 *                 enum: [1-10, 10-20, 20+]
 *                 default: 1-10
 *                 description: Expected number of doctors
 *           example:
 *             clinicName: "MediEase Healthcare"
 *             adminEmail: "admin@medieaseclinic.com"
 *             adminPassword: "Admin@123"
 *             doctorRange: "1-10"
 *     responses:
 *       201:
 *         description: Clinic admin registered successfully
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
 *                   example: "Clinic admin registered successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     clinic:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         clinicName:
 *                           type: string
 *                         adminEmail:
 *                           type: string
 *                         doctorRange:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                     admin:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       description: JWT authentication token
 *       400:
 *         description: Validation error or clinic already exists
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Register a new user account in the system (doctor or receptionist)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             firstName: "John"
 *             lastName: "Doe"
 *             email: "john.doe@example.com"
 *             password: "Password123"
 *             role: "doctor"
 *             phone: "+1234567890"
 *             speciality: "Cardiology"
 *             licenseNumber: "DOC123456"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error or user already exists
 *       401:
 *         description: Not authenticated (admin only)
 *       403:
 *         description: Not authorized (admin only)
 *       500:
 *         description: Server error
 */
router.post('/register', protect, authorize('admin'), [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .isIn(['admin', 'doctor', 'receptionist'])
    .withMessage('Role must be admin, doctor, or receptionist'),
  body('phone')
    .optional()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Please enter a valid phone number'),
  body('speciality')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Speciality cannot exceed 100 characters'),
  body('licenseNumber')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('License number cannot exceed 50 characters')
], register);

// Admin registration route (public - for initial clinic setup)
router.post('/register/admin', [
  body('clinicName')
    .trim()
    .notEmpty()
    .withMessage('Clinic name is required')
    .isLength({ max: 100 })
    .withMessage('Clinic name cannot exceed 100 characters'),
  body('adminEmail')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('adminPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('doctorRange')
    .optional()
    .isIn(['1-10', '10-20', '20+'])
    .withMessage('Doctor range must be 1-10, 10-20, or 20+')
], registerAdmin);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and return JWT token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: "admin@medieaseclinic.com"
 *             password: "Admin@123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the current authenticated user's profile information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/me', protect, getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, [
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('phone')
    .optional()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Please enter a valid phone number'),
  body('speciality')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Speciality cannot exceed 100 characters'),
  body('licenseNumber')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('License number cannot exceed 50 characters')
], updateProfile);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', protect, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
], changePassword);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, logout);

module.exports = router;
