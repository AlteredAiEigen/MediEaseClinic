const express = require('express');
const { getDoctors, getDoctor, updateDoctor, deleteDoctor, getDoctorStats } = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/doctors
// @desc    Get all doctors
// @access  Private
router.get('/', protect, getDoctors);

// @route   GET /api/doctors/stats
// @desc    Get doctor statistics
// @access  Private
router.get('/stats', protect, getDoctorStats);

// @route   GET /api/doctors/:id
// @desc    Get single doctor
// @access  Private
router.get('/:id', protect, getDoctor);

// @route   PUT /api/doctors/:id
// @desc    Update doctor
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin'), updateDoctor);

// @route   DELETE /api/doctors/:id
// @desc    Delete doctor
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), deleteDoctor);

module.exports = router;
