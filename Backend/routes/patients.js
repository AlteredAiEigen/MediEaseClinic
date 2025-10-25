const express = require('express');
const { body, param } = require('express-validator');
const {
  getPatients,
  getPatient,
  getPatientFullProfile,
  getPatientAppointments,
  getPatientByPatientId,
  createPatient,
  updatePatient,
  updatePatientVitals,
  updatePatientMedicalHistory,
  quickRegisterPatient,
  deletePatient,
  searchPatients,
  getPatientStats
} = require('../controllers/patientController');
const { protect, canAccessPatient, isAdmin } = require('../middleware/auth');
const { pagination, addPaginationMeta } = require('../middleware/pagination');

/**
 * @swagger
 * components:
 *   schemas:
 *     Patient:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier
 *         patientId:
 *           type: string
 *           description: Auto-generated patient ID (e.g., P00123456)
 *         firstName:
 *           type: string
 *           description: Patient's first name
 *         lastName:
 *           type: string
 *           description: Patient's last name
 *         gender:
 *           type: string
 *           enum: [Male, Female, Other]
 *         age:
 *           type: string
 *           description: Patient's age
 *         bloodGroup:
 *           type: string
 *           enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *         medicalHistory:
 *           type: string
 *         allergies:
 *           type: string
 *         familyHistory:
 *           type: string
 *         currentMedication:
 *           type: string
 *         vitals:
 *           type: object
 *           properties:
 *             bloodPressure:
 *               type: string
 *             heartRate:
 *               type: string
 *             temperature:
 *               type: string
 *             oxygenSaturation:
 *               type: string
 *             weight:
 *               type: string
 *             height:
 *               type: string
 *             bmi:
 *               type: string
 *         isActive:
 *           type: boolean
 *           default: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     PatientCreateRequest:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - gender
 *         - age
 *         - bloodGroup
 *         - dateOfBirth
 *         - email
 *         - phone
 *         - address
 *       properties:
 *         firstName:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *         lastName:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *         gender:
 *           type: string
 *           enum: [Male, Female, Other]
 *         age:
 *           type: string
 *         bloodGroup:
 *           type: string
 *           enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *         medicalHistory:
 *           type: string
 *         allergies:
 *           type: string
 *         familyHistory:
 *           type: string
 *         currentMedication:
 *           type: string
 *
 *     PatientResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/Patient'
 *             - type: object
 *               properties:
 *                 patients:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Patient'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 */

const router = express.Router();

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: Get all patients
 *     description: Retrieve a paginated list of all patients with optional filtering
 *     tags: [Patients]
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
 *         description: Number of patients per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query for filtering patients by name, ID, email, or phone
 *     responses:
 *       200:
 *         description: Patients retrieved successfully
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
 *                   description: Number of patients in current page
 *                 total:
 *                   type: integer
 *                   description: Total number of patients
 *                 data:
 *                   type: object
 *                   properties:
 *                     patients:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Patient'
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
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get('/', protect, canAccessPatient, pagination, addPaginationMeta, getPatients);

// @route   GET /api/patients/search
// @desc    Search patients
// @access  Private (Doctor, Receptionist, Admin)
router.get('/search', protect, canAccessPatient, searchPatients);

// @route   GET /api/patients/stats
// @desc    Get patient statistics
// @access  Private (Admin, Doctor)
router.get('/stats', protect, getPatientStats);

// @route   GET /api/patients/patient-id/:patientId
// @desc    Get patient by patient ID
// @access  Private (Doctor, Receptionist, Admin)
router.get('/patient-id/:patientId', protect, canAccessPatient, getPatientByPatientId);

// @route   GET /api/patients/:id
// @desc    Get single patient
// @access  Private (Doctor, Receptionist, Admin)
router.get('/:id', protect, canAccessPatient, getPatient);

/**
 * @swagger
 * /api/patients:
 *   post:
 *     summary: Create a new patient
 *     description: Register a new patient in the system
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatientCreateRequest'
 *           example:
 *             firstName: "John"
 *             lastName: "Doe"
 *             gender: "Male"
 *             age: "30"
 *             bloodGroup: "A+"
 *             dateOfBirth: "1993-01-01"
 *             email: "john.doe@example.com"
 *             phone: "+1234567890"
 *             address: "123 Main St, City, State 12345"
 *             medicalHistory: "No known allergies"
 *             allergies: "None"
 *             currentMedication: "None"
 *     responses:
 *       201:
 *         description: Patient created successfully
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
 *                   example: "Patient created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (requires receptionist or admin role)
 *       500:
 *         description: Server error
 */
router.post('/', protect, [
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
  body('gender')
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
  body('age')
    .notEmpty()
    .withMessage('Age is required'),
  body('bloodGroup')
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood group'),
  body('dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Please enter a valid phone number'),
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters'),
  body('medicalHistory')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Medical history cannot exceed 1000 characters'),
  body('allergies')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Allergies cannot exceed 500 characters'),
  body('familyHistory')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Family history cannot exceed 500 characters'),
  body('previousSurgeries')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Previous surgeries cannot exceed 500 characters'),
  body('currentMedication')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Current medication cannot exceed 500 characters')
], createPatient);

// @route   PUT /api/patients/:id
// @desc    Update patient
// @access  Private (Doctor, Receptionist, Admin)
router.put('/:id', protect, canAccessPatient, [
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
  body('gender')
    .optional()
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
  body('bloodGroup')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood group'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('phone')
    .optional()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Please enter a valid phone number'),
  body('address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters'),
  body('medicalHistory')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Medical history cannot exceed 1000 characters'),
  body('allergies')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Allergies cannot exceed 500 characters'),
  body('familyHistory')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Family history cannot exceed 500 characters'),
  body('previousSurgeries')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Previous surgeries cannot exceed 500 characters'),
  body('currentMedication')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Current medication cannot exceed 500 characters')
], updatePatient);

/**
 * @swagger
 * /api/patients/{id}/vitals:
 *   put:
 *     summary: Update patient vitals
 *     description: Update patient vital signs
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bloodPressure:
 *                 type: string
 *                 example: "120/80"
 *               heartRate:
 *                 type: string
 *                 example: "72"
 *               temperature:
 *                 type: string
 *                 example: "98.6"
 *               oxygenSaturation:
 *                 type: string
 *                 example: "98"
 *               weight:
 *                 type: string
 *                 example: "70"
 *               height:
 *                 type: string
 *                 example: "170"
 *               bmi:
 *                 type: string
 *                 example: "24.2"
 *     responses:
 *       200:
 *         description: Vitals updated successfully
 *       404:
 *         description: Patient not found
 */
router.put('/:id/vitals', protect, [
  param('id')
    .isMongoId()
    .withMessage('Invalid patient ID')
], updatePatientVitals);

/**
 * @swagger
 * /api/patients/{id}/medical-history:
 *   put:
 *     summary: Update patient medical history
 *     description: Update patient's medical history information
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               medicalHistory:
 *                 type: string
 *               allergies:
 *                 type: string
 *               familyHistory:
 *                 type: string
 *               previousSurgeries:
 *                 type: string
 *               currentMedication:
 *                 type: string
 *               medicationDosage:
 *                 type: string
 *               medicationFrequency:
 *                 type: string
 *               lastMedicationReview:
 *                 type: string
 *     responses:
 *       200:
 *         description: Medical history updated successfully
 *       404:
 *         description: Patient not found
 */
router.put('/:id/medical-history', protect, updatePatientMedicalHistory);

/**
 * @swagger
 * /api/patients/{id}/full-profile:
 *   get:
 *     summary: Get patient full profile with appointment history
 *     description: Retrieve complete patient profile including all appointments
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Full profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       404:
 *         description: Patient not found
 */
router.get('/:id/full-profile', protect, [
  param('id')
    .isMongoId()
    .withMessage('Invalid patient ID')
], getPatientFullProfile);

/**
 * @swagger
 * /api/patients/{id}/appointments:
 *   get:
 *     summary: Get patient's appointment history
 *     description: Retrieve all appointments for a specific patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: object
 *                   properties:
 *                     appointments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Appointment'
 *       404:
 *         description: Patient not found
 */
router.get('/:id/appointments', protect, [
  param('id')
    .isMongoId()
    .withMessage('Invalid patient ID')
], getPatientAppointments);

/**
 * @swagger
 * /api/patients/quick-register:
 *   post:
 *     summary: Quick patient registration for walk-ins
 *     description: Quickly register a new patient with minimal information
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - phone
 *               - age
 *               - gender
 *               - bloodGroup
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               age:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *               bloodGroup:
 *                 type: string
 *                 enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *     responses:
 *       201:
 *         description: Patient registered successfully
 *       200:
 *         description: Patient already exists
 *       400:
 *         description: Validation error
 */
router.post('/quick-register', protect, quickRegisterPatient);

// @route   DELETE /api/patients/:id
// @desc    Delete patient
// @access  Private (Admin)
router.delete('/:id', protect, isAdmin, deletePatient);

module.exports = router;
