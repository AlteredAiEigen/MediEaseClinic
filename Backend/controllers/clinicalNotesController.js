const ClinicalNote = require('../models/ClinicalNote');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');
const openaiUtils = require('../utils/openai');
const geminiUtils = require('../utils/gemini');

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
    const notes = await ClinicalNote.find({ actionable: true, completed: false })
      .populate('patient', 'firstName lastName phone')
      .populate('doctor', 'firstName lastName')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await ClinicalNote.countDocuments({ actionable: true, completed: false });

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
      return sendError(res, 'Validation failed', null, 400);
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

    // Create a temporary appointment for the consultation
    const appointmentData = {
      appointmentId: `APT${Date.now()}`,
      patient: patientId,
      doctor: doctorId,
      scheduledBy: doctorId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      duration: Math.max(15, Math.ceil(consultationDuration / 60)), // Convert seconds to minutes, minimum 15
      reason: symptoms || 'Consultation',
      priority: 'medium',
      status: 'completed'
    };

    const tempAppointment = await Appointment.create(appointmentData);

    // Generate clinical notes using the static method
    const notes = await ClinicalNote.generateFromConsultation(
      patientId,
      tempAppointment._id,
      doctorId,
      consultationDuration
    );

    // Save notes to database individually to ensure pre-save middleware runs
    const savedNotes = [];
    for (const noteData of notes) {
      const note = new ClinicalNote(noteData);
      await note.save();
      savedNotes.push(note);
    }

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
      return sendError(res, 'Validation failed', null, 400);
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
      actionable: noteData.isActionable || false,
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
    if (error.name === 'ValidationError') {
      sendError(res, 'Validation failed', null, 400);
    } else {
      sendError(res, 'Failed to create clinical note', error.message);
    }
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
      { completed: true, completedAt: new Date() },
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

// Generate clinical note from recording transcript using AI
const generateNoteFromTranscript = async (req, res) => {
  try {
    const { transcript, patientId, appointmentId, useGemini } = req.body;

    if (!transcript || !transcript.trim()) {
      return sendError(res, 'Transcript is required', null, 400);
    }

    if (!patientId) {
      return sendError(res, 'Patient ID is required', null, 400);
    }

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return sendNotFound(res, 'Patient not found');
    }

    // Select AI service (OpenAI or Gemini)
    const aiService = useGemini ? geminiUtils : openaiUtils;

    // Extract clinical data from transcript
    const result = await aiService.extractClinicalDataFromTranscript(transcript);

    if (!result.success) {
      return sendError(res, 'Failed to generate clinical note from transcript', result.error, 500);
    }

    const clinicalData = result.data;

    // Create clinical note with AI-generated data
    const note = await ClinicalNote.create({
      patient: patientId,
      doctor: req.user.id,
      appointment: appointmentId || null,
      title: clinicalData.chiefComplaint || 'AI-Generated Clinical Note',
      content: JSON.stringify(clinicalData, null, 2),
      chiefComplaint: clinicalData.chiefComplaint,
      currentSymptoms: clinicalData.currentSymptoms,
      painLevel: clinicalData.painLevel,
      diagnosis: clinicalData.diagnosis,
      treatmentPlan: clinicalData.treatmentPlan,
      recommendations: clinicalData.recommendations,
      category: 'consultation',
      tags: ['ai-generated', 'transcript'],
      aiGenerated: true
    });

    await note.populate([
      { path: 'patient', select: 'firstName lastName patientId phone' },
      { path: 'doctor', select: 'firstName lastName' },
      { path: 'appointment' }
    ]);

    sendSuccess(res, 'Clinical note generated successfully from transcript', {
      note,
      extractedData: clinicalData
    }, 201);
  } catch (error) {
    console.error('Error generating note from transcript:', error);
    sendError(res, 'Failed to generate clinical note', error.message);
  }
};

// Generate treatment plan using AI
const generateAITreatmentPlan = async (req, res) => {
  try {
    const { symptoms, diagnosis, useGemini } = req.body;

    if (!symptoms || !diagnosis) {
      return sendError(res, 'Symptoms and diagnosis are required', null, 400);
    }

    // Select AI service (OpenAI or Gemini)
    const aiService = useGemini ? geminiUtils : openaiUtils;

    // Generate treatment plan
    const result = await aiService.generateTreatmentPlan(symptoms, diagnosis);

    if (!result.success) {
      return sendError(res, 'Failed to generate treatment plan', result.error, 500);
    }

    sendSuccess(res, 'Treatment plan generated successfully', result.data);
  } catch (error) {
    console.error('Error generating treatment plan:', error);
    sendError(res, 'Failed to generate treatment plan', error.message);
  }
};

// Generate prescription suggestions using AI
const generateAIPrescription = async (req, res) => {
  try {
    const { noteId, useGemini } = req.body;

    if (!noteId) {
      return sendError(res, 'Clinical note ID is required', null, 400);
    }

    // Get clinical note
    const note = await ClinicalNote.findById(noteId);
    if (!note) {
      return sendNotFound(res, 'Clinical note not found');
    }

    // Select AI service (OpenAI or Gemini)
    const aiService = useGemini ? geminiUtils : openaiUtils;

    // Generate prescription
    const result = await aiService.generatePrescriptionFromNotes(note);

    if (!result.success) {
      return sendError(res, 'Failed to generate prescription', result.error, 500);
    }

    sendSuccess(res, 'Prescription generated successfully', {
      medications: result.data
    });
  } catch (error) {
    console.error('Error generating prescription:', error);
    sendError(res, 'Failed to generate prescription', error.message);
  }
};

// Summarize consultation using AI
const summarizeAIConsultation = async (req, res) => {
  try {
    const { transcript, useGemini } = req.body;

    if (!transcript || !transcript.trim()) {
      return sendError(res, 'Transcript is required', null, 400);
    }

    // Select AI service (OpenAI or Gemini)
    const aiService = useGemini ? geminiUtils : openaiUtils;

    // Generate summary
    const result = await aiService.summarizeConsultation(transcript);

    if (!result.success) {
      return sendError(res, 'Failed to summarize consultation', result.error, 500);
    }

    sendSuccess(res, 'Consultation summarized successfully', {
      summary: result.data
    });
  } catch (error) {
    console.error('Error summarizing consultation:', error);
    sendError(res, 'Failed to summarize consultation', error.message);
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
  deleteClinicalNote,
  generateNoteFromTranscript,
  generateAITreatmentPlan,
  generateAIPrescription,
  summarizeAIConsultation
};
