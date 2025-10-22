const express = require('express');
const { 
  getRecordings, 
  getRecording, 
  createRecording, 
  updateRecording, 
  deleteRecording,
  getRecordingsByPatient,
  getRecordingsByDoctor,
  processRecording
} = require('../controllers/recordingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/recordings
// @desc    Get all recordings
// @access  Private (Doctor, Admin)
router.get('/', protect, authorize('doctor', 'admin'), getRecordings);

// @route   GET /api/recordings/patient/:patientId
// @desc    Get recordings by patient
// @access  Private (Doctor, Admin)
router.get('/patient/:patientId', protect, authorize('doctor', 'admin'), getRecordingsByPatient);

// @route   GET /api/recordings/doctor/:doctorId
// @desc    Get recordings by doctor
// @access  Private (Doctor, Admin)
router.get('/doctor/:doctorId', protect, authorize('doctor', 'admin'), getRecordingsByDoctor);

// @route   GET /api/recordings/:id
// @desc    Get single recording
// @access  Private (Doctor, Admin)
router.get('/:id', protect, authorize('doctor', 'admin'), getRecording);

// @route   POST /api/recordings
// @desc    Create new recording
// @access  Private (Doctor)
router.post('/', protect, authorize('doctor'), createRecording);

// @route   PUT /api/recordings/:id
// @desc    Update recording
// @access  Private (Doctor)
router.put('/:id', protect, authorize('doctor'), updateRecording);

// @route   POST /api/recordings/:id/process
// @desc    Process recording (transcription)
// @access  Private (Doctor)
router.post('/:id/process', protect, authorize('doctor'), processRecording);

// @route   DELETE /api/recordings/:id
// @desc    Delete recording
// @access  Private (Doctor, Admin)
router.delete('/:id', protect, authorize('doctor', 'admin'), deleteRecording);

module.exports = router;
