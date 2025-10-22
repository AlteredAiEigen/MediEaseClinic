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

const router = express.Router();

// All admin routes require admin role
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', getDashboardStats);

// @route   GET /api/admin/stats
// @desc    Get system statistics
// @access  Private (Admin)
router.get('/stats', getSystemStats);

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', getUsers);

// @route   POST /api/admin/users
// @desc    Create new user
// @access  Private (Admin)
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
