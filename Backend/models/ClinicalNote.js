const mongoose = require('mongoose');

const clinicalNoteSchema = new mongoose.Schema({
  noteId: {
    type: String,
    required: false,
    uppercase: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient is required']
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: false // Optional - allows notes for walk-in patients
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor is required']
  },
  type: {
    type: String,
    enum: ['vitals', 'symptom', 'diagnosis', 'treatment', 'followup', 'prescription', 'general'],
    required: [true, 'Note type is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    maxlength: [2000, 'Content cannot exceed 2000 characters']
  },
  category: {
    type: String,
    enum: ['consultation', 'diagnosis', 'treatment', 'follow-up', 'general'],
    default: 'consultation'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['draft', 'reviewed', 'approved', 'archived'],
    default: 'draft'
  },
  timestamp: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Timestamp must be in HH:MM format']
  },
  actionable: {
    type: Boolean,
    default: false
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Prescription specific fields
  prescription: {
    medicationName: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String,
    quantity: Number,
    refills: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  // Follow-up specific fields
  followUp: {
    required: Boolean,
    date: String,
    notes: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  // AI generated fields
  aiGenerated: {
    type: Boolean,
    default: false
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  // Review fields
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewNotes: String,
  // Virtual fields
  patientName: String,
  doctorName: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
clinicalNoteSchema.index({ noteId: 1 }, { unique: true });
clinicalNoteSchema.index({ patient: 1 });
clinicalNoteSchema.index({ appointment: 1 });
clinicalNoteSchema.index({ doctor: 1 });
clinicalNoteSchema.index({ type: 1 });
clinicalNoteSchema.index({ status: 1 });
clinicalNoteSchema.index({ actionable: 1, completed: 1 });
clinicalNoteSchema.index({ tags: 1 });

// Pre-save middleware to generate note ID
clinicalNoteSchema.pre('save', function(next) {
  if (!this.noteId) {
    const timestamp = Date.now().toString().slice(-8);
    this.noteId = `NOTE${timestamp}`;
  }
  next();
});

// Pre-save middleware to populate names
clinicalNoteSchema.pre('save', async function(next) {
  try {
    if (this.isModified('patient') && this.patient) {
      const patient = await mongoose.model('Patient').findById(this.patient);
      if (patient) {
        this.patientName = `${patient.firstName} ${patient.lastName}`;
      }
    }
    
    if (this.isModified('doctor') && this.doctor) {
      const doctor = await mongoose.model('User').findById(this.doctor);
      if (doctor) {
        this.doctorName = `${doctor.firstName} ${doctor.lastName}`;
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to search notes
clinicalNoteSchema.statics.searchNotes = function(query, filters = {}) {
  const searchRegex = new RegExp(query, 'i');
  const searchQuery = {
    $or: [
      { title: searchRegex },
      { content: searchRegex },
      { tags: { $in: [searchRegex] } }
    ],
    ...filters
  };
  
  return this.find(searchQuery)
    .populate('patient', 'firstName lastName patientId')
    .populate('doctor', 'firstName lastName speciality')
    .populate('appointment', 'appointmentId date time')
    .sort({ createdAt: -1 });
};

// Static method to get actionable notes
clinicalNoteSchema.statics.getActionableNotes = function(patientId = null, doctorId = null) {
  const query = {
    actionable: true,
    completed: false
  };
  
  if (patientId) {
    query.patient = patientId;
  }
  
  if (doctorId) {
    query.doctor = doctorId;
  }
  
  return this.find(query)
    .populate('patient', 'firstName lastName patientId')
    .populate('doctor', 'firstName lastName speciality')
    .populate('appointment', 'appointmentId date time')
    .sort({ priority: -1, createdAt: -1 });
};

// Static method to generate notes from consultation
clinicalNoteSchema.statics.generateFromConsultation = async function(patientId, appointmentId, doctorId, duration) {
  // This would typically integrate with AI service
  // For now, we'll generate mock notes based on duration
  
  const mockNotes = [
    {
      patient: patientId,
      appointment: appointmentId,
      doctor: doctorId,
      type: 'vitals',
      title: 'Vital Signs Recorded',
      content: 'Blood pressure: 128/82 mmHg, Heart rate: 72 bpm, Temperature: 98.6°F, Oxygen saturation: 98%',
      priority: 'high',
      status: 'approved',
      timestamp: new Date().toTimeString().slice(0, 5),
      actionable: false,
      tags: ['vitals', 'baseline'],
      aiGenerated: true,
      confidence: 0.95
    },
    {
      patient: patientId,
      appointment: appointmentId,
      doctor: doctorId,
      type: 'symptom',
      title: 'Patient Symptoms',
      content: 'Patient reports intermittent chest pain, shortness of breath after exertion, and occasional dizziness. Pain described as sharp, lasting 5-10 minutes.',
      priority: 'high',
      status: 'approved',
      timestamp: new Date(Date.now() + 3 * 60000).toTimeString().slice(0, 5),
      actionable: true,
      tags: ['symptoms', 'chest-pain', 'shortness-of-breath'],
      aiGenerated: true,
      confidence: 0.88
    },
    {
      patient: patientId,
      appointment: appointmentId,
      doctor: doctorId,
      type: 'diagnosis',
      title: 'Preliminary Diagnosis',
      content: 'Suspected angina pectoris based on symptoms and risk factors. Patient has history of hypertension and family history of heart disease.',
      priority: 'high',
      status: 'approved',
      timestamp: new Date(Date.now() + 6 * 60000).toTimeString().slice(0, 5),
      actionable: true,
      tags: ['diagnosis', 'angina', 'cardiology'],
      aiGenerated: true,
      confidence: 0.82
    },
    {
      patient: patientId,
      appointment: appointmentId,
      doctor: doctorId,
      type: 'treatment',
      title: 'Immediate Treatment Plan',
      content: 'Prescribed nitroglycerin 0.4mg sublingual PRN for chest pain. Advised lifestyle modifications including low-sodium diet and regular exercise.',
      priority: 'high',
      status: 'approved',
      timestamp: new Date(Date.now() + 10 * 60000).toTimeString().slice(0, 5),
      actionable: true,
      tags: ['treatment', 'medication', 'lifestyle'],
      aiGenerated: true,
      confidence: 0.90
    },
    {
      patient: patientId,
      appointment: appointmentId,
      doctor: doctorId,
      type: 'followup',
      title: 'Follow-up Recommendations',
      content: 'Schedule cardiology consultation within 7 days. Order ECG, echocardiogram, and stress test. Monitor blood pressure daily at home.',
      priority: 'medium',
      status: 'approved',
      timestamp: new Date(Date.now() + 13 * 60000).toTimeString().slice(0, 5),
      actionable: true,
      tags: ['followup', 'cardiology', 'testing'],
      followUp: {
        required: true,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Cardiology consultation and diagnostic tests',
        priority: 'high'
      },
      aiGenerated: true,
      confidence: 0.85
    }
  ];
  
  // Adjust notes based on consultation duration
  if (duration < 30) {
    return mockNotes.slice(0, 2); // Shorter consultation
  } else if (duration < 60) {
    return mockNotes.slice(0, 4); // Medium consultation
  }
  
  return mockNotes; // Full consultation
};

module.exports = mongoose.model('ClinicalNote', clinicalNoteSchema);
