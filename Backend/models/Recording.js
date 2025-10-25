const mongoose = require('mongoose');

const recordingSchema = new mongoose.Schema({
  recordingId: {
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
    required: [true, 'Appointment is required']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor is required']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [0, 'Duration cannot be negative']
  },
  filePath: {
    type: String,
    required: [true, 'File path is required']
  },
  fileName: {
    type: String,
    required: [true, 'File name is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
    default: 'audio/mpeg'
  },
  status: {
    type: String,
    enum: ['recording', 'processing', 'completed', 'failed', 'archived', 'error', 'processed'],
    default: 'recording'
  },
  transcription: {
    type: String,
    default: ''
  },
  transcriptionConfidence: {
    type: Number,
    min: 0,
    max: 1
  },
  processingStartedAt: Date,
  processingCompletedAt: Date,
  errorMessage: String,
  // Audio quality metrics
  audioQuality: {
    sampleRate: Number,
    bitRate: Number,
    channels: Number,
    format: String
  },
  // AI processing metadata
  aiProcessing: {
    model: String,
    version: String,
    processingTime: Number,
    language: {
      type: String,
      default: 'en-US'
    }
  },
  // Security and privacy
  encryptionKey: String,
  isEncrypted: {
    type: Boolean,
    default: false
  },
  retentionPolicy: {
    type: String,
    enum: ['standard', 'extended', 'permanent'],
    default: 'standard'
  },
  expiresAt: Date,
  // Virtual fields
  patientName: String,
  doctorName: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
recordingSchema.index({ recordingId: 1 }, { unique: true });
recordingSchema.index({ patient: 1 });
recordingSchema.index({ appointment: 1 });
recordingSchema.index({ doctor: 1 });
recordingSchema.index({ status: 1 });
recordingSchema.index({ createdAt: -1 });
recordingSchema.index({ expiresAt: 1 });

// Pre-save middleware to generate recording ID
recordingSchema.pre('save', function(next) {
  if (!this.recordingId) {
    const timestamp = Date.now().toString().slice(-8);
    this.recordingId = `REC${timestamp}`;
  }
  next();
});

// Pre-save middleware to populate names
recordingSchema.pre('save', async function(next) {
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

// Pre-save middleware to set expiration date
recordingSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    const retentionDays = {
      'standard': 90,
      'extended': 365,
      'permanent': null
    };
    
    if (retentionDays[this.retentionPolicy]) {
      this.expiresAt = new Date(Date.now() + retentionDays[this.retentionPolicy] * 24 * 60 * 60 * 1000);
    }
  }
  next();
});

// Static method to generate mock transcription
recordingSchema.statics.generateMockTranscription = function(duration) {
  // Simulate AI transcription based on recording duration
  let transcription = '';
  
  if (duration < 30) {
    transcription = `Brief consultation recorded. Duration: ${duration} seconds. Patient discussed minor symptoms and received basic advice.`;
  } else if (duration < 120) {
    transcription = `Standard consultation recorded. Duration: ${duration} seconds. Patient presented with symptoms, discussed medical history, and received treatment recommendations. Doctor provided detailed examination and care instructions.`;
  } else {
    transcription = `Comprehensive consultation recorded. Duration: ${duration} seconds. Extended discussion of patient's condition, detailed medical history review, thorough examination, and comprehensive treatment plan. Multiple symptoms addressed with detailed care instructions and follow-up recommendations.`;
  }
  
  return {
    transcription,
    confidence: Math.random() * 0.3 + 0.7 // 70-100% confidence
  };
};

// Static method to get recordings by patient
recordingSchema.statics.getRecordingsByPatient = function(patientId, limit = 10) {
  return this.find({ patient: patientId })
    .populate('patient', 'firstName lastName patientId')
    .populate('doctor', 'firstName lastName speciality')
    .populate('appointment', 'appointmentId date time reason')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get recordings by doctor
recordingSchema.statics.getRecordingsByDoctor = function(doctorId, limit = 10) {
  return this.find({ doctor: doctorId })
    .populate('patient', 'firstName lastName patientId')
    .populate('appointment', 'appointmentId date time reason')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get processing statistics
recordingSchema.statics.getProcessingStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalDuration: { $sum: '$duration' }
      }
    }
  ]);
};

// Instance method to check if recording is expired
recordingSchema.methods.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

// Instance method to get formatted duration
recordingSchema.methods.getFormattedDuration = function() {
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

module.exports = mongoose.model('Recording', recordingSchema);
