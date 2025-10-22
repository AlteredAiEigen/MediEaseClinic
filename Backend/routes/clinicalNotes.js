const express = require('express');
const { 
  getClinicalNotes, 
  getClinicalNote, 
  createClinicalNote, 
  updateClinicalNote, 
  deleteClinicalNote,
  generateNotesFromConsultation,
  getActionableNotes,
  markNoteComplete
} = require('../controllers/clinicalNotesController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/clinical-notes
// @desc    Get all clinical notes
// @access  Private (Doctor, Admin)
router.get('/', protect, authorize('doctor', 'admin'), getClinicalNotes);

// @route   GET /api/clinical-notes/actionable
// @desc    Get actionable notes
// @access  Private (Doctor, Admin)
router.get('/actionable', protect, authorize('doctor', 'admin'), getActionableNotes);

// @route   POST /api/clinical-notes/generate
// @desc    Generate notes from consultation
// @access  Private (Doctor)
router.post('/generate', protect, authorize('doctor'), generateNotesFromConsultation);

// @route   GET /api/clinical-notes/:id
// @desc    Get single clinical note
// @access  Private (Doctor, Admin)
router.get('/:id', protect, authorize('doctor', 'admin'), getClinicalNote);

// @route   POST /api/clinical-notes
// @desc    Create new clinical note
// @access  Private (Doctor)
router.post('/', protect, authorize('doctor'), createClinicalNote);

// @route   PUT /api/clinical-notes/:id
// @desc    Update clinical note
// @access  Private (Doctor)
router.put('/:id', protect, authorize('doctor'), updateClinicalNote);

// @route   PUT /api/clinical-notes/:id/complete
// @desc    Mark note as complete
// @access  Private (Doctor)
router.put('/:id/complete', protect, authorize('doctor'), markNoteComplete);

// @route   DELETE /api/clinical-notes/:id
// @desc    Delete clinical note
// @access  Private (Doctor, Admin)
router.delete('/:id', protect, authorize('doctor', 'admin'), deleteClinicalNote);

module.exports = router;
