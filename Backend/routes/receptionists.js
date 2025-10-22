const express = require('express');
const { getReceptionists, getReceptionist, updateReceptionist, deleteReceptionist } = require('../controllers/receptionistController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/receptionists
// @desc    Get all receptionists
// @access  Private (Admin)
router.get('/', protect, authorize('admin'), getReceptionists);

// @route   GET /api/receptionists/:id
// @desc    Get single receptionist
// @access  Private (Admin)
router.get('/:id', protect, authorize('admin'), getReceptionist);

// @route   PUT /api/receptionists/:id
// @desc    Update receptionist
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin'), updateReceptionist);

// @route   DELETE /api/receptionists/:id
// @desc    Delete receptionist
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), deleteReceptionist);

module.exports = router;
