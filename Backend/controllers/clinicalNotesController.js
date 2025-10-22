const ClinicalNote = require('../models/ClinicalNote');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');

// Get all clinical notes
const getClinicalNotes = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, patientId, doctorId, category, priority } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (patientId) query.patient = patientId;
    if (doctorId) query.doctor = doctorId;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Get clinical notes
    const notes = await ClinicalNote.find(query)
      .populate('patient', 'firstName lastName phone')
      .populate('doctor', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await ClinicalNote.countDocuments(query);

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

    sendSuccess(res, 'Clinical notes retrieved successfully', {
      notes,
      pagination
    });
  } catch (error) {
    console.error('Error getting clinical notes:', error);
    sendError(res, 'Failed to retrieve clinical notes', error.message);
  }
};

// Get actionable notes
const getActionableNotes = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Get actionable notes
    const notes = await ClinicalNote.find({ isActionable: true, isCompleted: false })
      .populate('patient', 'firstName lastName phone')
      .populate('doctor', 'firstName lastName')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await ClinicalNote.countDocuments({ isActionable: true, isCompleted: false });

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

    sendSuccess(res, 'Actionable notes retrieved successfully', {
      notes,
      pagination
    });
  } catch (error) {
    console.error('Error getting actionable notes:', error);
    sendError(res, 'Failed to retrieve actionable notes', error.message);
  }
};

// Generate notes from consultation
const generateNotesFromConsultation = async (req, res) => {
  try {
    const { patientId, doctorId, consultationDuration, symptoms, diagnosis, treatment, followUp } = req.body;

    // Validate required fields
    if (!patientId || !doctorId || !consultationDuration) {
      return sendError(res, 'Patient ID, Doctor ID, and consultation duration are required', null, 400);
    }

    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return sendError(res, 'Patient not found', null, 400);
    }

    // Check if doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return sendError(res, 'Doctor not found', null, 400);
    }

    // Generate clinical notes using the static method
    const notes = await ClinicalNote.generateFromConsultation(
      patientId,
      doctorId,
      consultationDuration,
      { symptoms, diagnosis, treatment, followUp }
    );

    // Save notes to database
    const savedNotes = await ClinicalNote.insertMany(notes);

    sendSuccess(res, 'Clinical notes generated successfully', { notes: savedNotes }, 201);
  } catch (error) {
    console.error('Error generating clinical notes:', error);
    sendError(res, 'Failed to generate clinical notes', error.message);
  }
};

// Get single clinical note
const getClinicalNote = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await ClinicalNote.findById(id)
      .populate('patient', 'firstName lastName phone email')
      .populate('doctor', 'firstName lastName email');

    if (!note) {
      return sendNotFound(res, 'Clinical note not found');
    }

    sendSuccess(res, 'Clinical note retrieved successfully', { note });
  } catch (error) {
    console.error('Error getting clinical note:', error);
    sendError(res, 'Failed to retrieve clinical note', error.message);
  }
};

// Create new clinical note
const createClinicalNote = async (req, res) => {
  try {
    const noteData = req.body;

    // Validate required fields
    if (!noteData.patientId || !noteData.doctorId || !noteData.title || !noteData.content) {
      return sendError(res, 'Patient ID, Doctor ID, title, and content are required', null, 400);
    }

    // Check if patient exists
    const patient = await Patient.findById(noteData.patientId);
    if (!patient) {
      return sendError(res, 'Patient not found', null, 400);
    }

    // Check if doctor exists
    const doctor = await User.findById(noteData.doctorId);
    if (!doctor) {
      return sendError(res, 'Doctor not found', null, 400);
    }

    // Create note
    const note = new ClinicalNote({
      patient: noteData.patientId,
      doctor: noteData.doctorId,
      appointment: noteData.appointmentId,
      title: noteData.title,
      content: noteData.content,
      type: noteData.type || 'general',
      category: noteData.category || 'consultation',
      priority: noteData.priority || 'medium',
      isActionable: noteData.isActionable || false,
      actionItems: noteData.actionItems || [],
      timestamp: new Date().toTimeString().slice(0, 5)
    });

    await note.save();

    // Populate the note
    await note.populate('patient', 'firstName lastName phone');
    await note.populate('doctor', 'firstName lastName');

    sendSuccess(res, 'Clinical note created successfully', { note }, 201);
  } catch (error) {
    console.error('Error creating clinical note:', error);
    sendError(res, 'Failed to create clinical note', error.message);
  }
};

// Update clinical note
const updateClinicalNote = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const note = await ClinicalNote.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('patient', 'firstName lastName phone')
     .populate('doctor', 'firstName lastName');

    if (!note) {
      return sendNotFound(res, 'Clinical note not found');
    }

    sendSuccess(res, 'Clinical note updated successfully', { note });
  } catch (error) {
    console.error('Error updating clinical note:', error);
    sendError(res, 'Failed to update clinical note', error.message);
  }
};

// Mark note as complete
const markNoteComplete = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await ClinicalNote.findByIdAndUpdate(
      id,
      { isCompleted: true, completedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('patient', 'firstName lastName phone')
     .populate('doctor', 'firstName lastName');

    if (!note) {
      return sendNotFound(res, 'Clinical note not found');
    }

    sendSuccess(res, 'Clinical note marked as complete', { note });
  } catch (error) {
    console.error('Error marking note as complete:', error);
    sendError(res, 'Failed to mark note as complete', error.message);
  }
};

// Delete clinical note
const deleteClinicalNote = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await ClinicalNote.findByIdAndDelete(id);

    if (!note) {
      return sendNotFound(res, 'Clinical note not found');
    }

    sendSuccess(res, 'Clinical note deleted successfully');
  } catch (error) {
    console.error('Error deleting clinical note:', error);
    sendError(res, 'Failed to delete clinical note', error.message);
  }
};

module.exports = {
  getClinicalNotes,
  getActionableNotes,
  generateNotesFromConsultation,
  getClinicalNote,
  createClinicalNote,
  updateClinicalNote,
  markNoteComplete,
  deleteClinicalNote
};
