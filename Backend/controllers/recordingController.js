const Recording = require('../models/Recording');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');

// Get all recordings
const getRecordings = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, patientId, doctorId, status } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (patientId) query.patient = patientId;
    if (doctorId) query.doctor = doctorId;
    if (status) query.status = status;
    
    if (search) {
      query.$or = [
        { transcription: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Get recordings
    const recordings = await Recording.find(query)
      .populate('patient', 'firstName lastName phone')
      .populate('doctor', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Recording.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext,
      hasPrev
    };

    sendSuccess(res, 'Recordings retrieved successfully', {
      recordings,
      pagination
    });
  } catch (error) {
    console.error('Error getting recordings:', error);
    sendError(res, 'Failed to retrieve recordings', error.message);
  }
};

// Get recordings by patient
const getRecordingsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return sendNotFound(res, 'Patient not found');
    }

    // Get recordings for patient
    const recordings = await Recording.find({ patient: patientId })
      .populate('patient', 'firstName lastName phone')
      .populate('doctor', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Recording.countDocuments({ patient: patientId });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext,
      hasPrev
    };

    sendSuccess(res, 'Patient recordings retrieved successfully', {
      recordings,
      pagination
    });
  } catch (error) {
    console.error('Error getting patient recordings:', error);
    sendError(res, 'Failed to retrieve patient recordings', error.message);
  }
};

// Get recordings by doctor
const getRecordingsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Check if doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return sendNotFound(res, 'Doctor not found');
    }

    // Get recordings for doctor
    const recordings = await Recording.find({ doctor: doctorId })
      .populate('patient', 'firstName lastName phone')
      .populate('doctor', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Recording.countDocuments({ doctor: doctorId });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext,
      hasPrev
    };

    sendSuccess(res, 'Doctor recordings retrieved successfully', {
      recordings,
      pagination
    });
  } catch (error) {
    console.error('Error getting doctor recordings:', error);
    sendError(res, 'Failed to retrieve doctor recordings', error.message);
  }
};

// Get single recording
const getRecording = async (req, res) => {
  try {
    const { id } = req.params;

    const recording = await Recording.findById(id)
      .populate('patient', 'firstName lastName phone email')
      .populate('doctor', 'firstName lastName email');

    if (!recording) {
      return sendNotFound(res, 'Recording not found');
    }

    sendSuccess(res, 'Recording retrieved successfully', { recording });
  } catch (error) {
    console.error('Error getting recording:', error);
    sendError(res, 'Failed to retrieve recording', error.message);
  }
};

// Create new recording
const createRecording = async (req, res) => {
  try {
    const recordingData = req.body;

    // Validate required fields
    if (!recordingData.patientId || !recordingData.doctorId || !recordingData.duration) {
      return sendError(res, 'Patient ID, Doctor ID, and duration are required', null, 400);
    }

    // Check if patient exists
    const patient = await Patient.findById(recordingData.patientId);
    if (!patient) {
      return sendError(res, 'Patient not found', null, 400);
    }

    // Check if doctor exists
    const doctor = await User.findById(recordingData.doctorId);
    if (!doctor) {
      return sendError(res, 'Doctor not found', null, 400);
    }

    // Create recording
    const recording = new Recording({
      patient: recordingData.patientId,
      doctor: recordingData.doctorId,
      appointment: recordingData.appointmentId,
      duration: recordingData.duration,
      filePath: recordingData.filePath || '/uploads/default.mp3',
      fileName: recordingData.fileName || 'recording.mp3',
      fileSize: recordingData.fileSize || 0,
      mimeType: recordingData.mimeType || 'audio/mpeg',
      transcription: recordingData.transcription || '',
      status: recordingData.status || 'recording'
    });

    await recording.save();

    // Populate the recording
    await recording.populate('patient', 'firstName lastName phone');
    await recording.populate('doctor', 'firstName lastName');

    sendSuccess(res, 'Recording created successfully', { recording }, 201);
  } catch (error) {
    console.error('Error creating recording:', error);
    sendError(res, 'Failed to create recording', error.message);
  }
};

// Update recording
const updateRecording = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const recording = await Recording.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('patient', 'firstName lastName phone')
     .populate('doctor', 'firstName lastName');

    if (!recording) {
      return sendNotFound(res, 'Recording not found');
    }

    sendSuccess(res, 'Recording updated successfully', { recording });
  } catch (error) {
    console.error('Error updating recording:', error);
    sendError(res, 'Failed to update recording', error.message);
  }
};

// Process recording
const processRecording = async (req, res) => {
  try {
    const { id } = req.params;

    const recording = await Recording.findById(id);
    if (!recording) {
      return sendNotFound(res, 'Recording not found');
    }

    // Simulate processing
    recording.status = 'processing';
    await recording.save();

    // Simulate processing delay
    setTimeout(async () => {
      try {
        // Mock transcription processing
        if (!recording.transcription) {
          recording.transcription = 'Mock transcription generated from audio processing...';
        }
        
        recording.status = 'processed';
        recording.processedAt = new Date();
        await recording.save();

        console.log(`Recording ${id} processed successfully`);
      } catch (error) {
        console.error('Error processing recording:', error);
        recording.status = 'error';
        recording.error = error.message;
        await recording.save();
      }
    }, 2000); // 2 second delay

    sendSuccess(res, 'Recording processing started', { recording });
  } catch (error) {
    console.error('Error processing recording:', error);
    sendError(res, 'Failed to process recording', error.message);
  }
};

// Delete recording
const deleteRecording = async (req, res) => {
  try {
    const { id } = req.params;

    const recording = await Recording.findByIdAndDelete(id);

    if (!recording) {
      return sendNotFound(res, 'Recording not found');
    }

    sendSuccess(res, 'Recording deleted successfully');
  } catch (error) {
    console.error('Error deleting recording:', error);
    sendError(res, 'Failed to delete recording', error.message);
  }
};

module.exports = {
  getRecordings,
  getRecordingsByPatient,
  getRecordingsByDoctor,
  getRecording,
  createRecording,
  updateRecording,
  processRecording,
  deleteRecording
};
