const express = require('express');
const { body, param } = require('express-validator');
const {
  getPatients,
  getPatient,
  getPatientByPatientId,
  createPatient,
  updatePatient,
  deletePatient,
  searchPatients,
  getPatientStats
} = require('../controllers/patientController');
const { protect, canAccessPatient, isAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/patients
// @desc    Get all patients
// @access  Private (Doctor, Receptionist, Admin)
router.get('/', protect, canAccessPatient, getPatients);

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

// @route   POST /api/patients
// @desc    Create new patient
// @access  Private (Receptionist, Admin)
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

// @route   DELETE /api/patients/:id
// @desc    Delete patient
// @access  Private (Admin)
router.delete('/:id', protect, isAdmin, deletePatient);

module.exports = router;
