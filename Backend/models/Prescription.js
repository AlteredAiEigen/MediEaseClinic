const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medication name is required'],
    trim: true
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required'],
    trim: true
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
    trim: true
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    trim: true
  },
  instructions: {
    type: String,
    default: ''
  }
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
  prescriptionId: {
    type: String,
    required: false, // Will be auto-generated
    uppercase: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient is required']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor is required']
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  queue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Queue'
  },
  medications: {
    type: [medicationSchema],
    validate: [arrayMinLength, 'At least one medication is required']
  },
  diagnosis: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    default: ''
  },
  imagePublicId: {
    type: String,
    default: ''
  },
  validUntil: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  prescribedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Validator function
function arrayMinLength(val) {
  return val && val.length > 0;
}

// Indexes
prescriptionSchema.index({ prescriptionId: 1 }, { unique: true });
prescriptionSchema.index({ patient: 1 });
prescriptionSchema.index({ doctor: 1 });
prescriptionSchema.index({ appointment: 1 });
prescriptionSchema.index({ prescribedAt: 1 });
prescriptionSchema.index({ isActive: 1 });

// Pre-save middleware to generate prescription ID
prescriptionSchema.pre('save', function(next) {
  if (!this.prescriptionId) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.prescriptionId = `RX${timestamp}${random}`;
  }
  
  // Set validity period (default 30 days from prescription date)
  if (!this.validUntil) {
    const validityDate = new Date(this.prescribedAt);
    validityDate.setDate(validityDate.getDate() + 30);
    this.validUntil = validityDate;
  }
  
  next();
});

// Static method to get patient prescriptions
prescriptionSchema.statics.getPatientPrescriptions = function(patientId, options = {}) {
  const query = {
    patient: patientId,
    isActive: true
  };
  
  if (options.activeOnly) {
    query.validUntil = { $gte: new Date() };
  }
  
  return this.find(query)
    .populate('doctor', 'firstName lastName speciality')
    .populate('patient', 'firstName lastName patientId')
    .populate('appointment', 'date time')
    .sort({ prescribedAt: -1 });
};

// Static method to get doctor prescriptions
prescriptionSchema.statics.getDoctorPrescriptions = function(doctorId, options = {}) {
  const query = {
    doctor: doctorId,
    isActive: true
  };
  
  if (options.startDate && options.endDate) {
    query.prescribedAt = {
      $gte: new Date(options.startDate),
      $lte: new Date(options.endDate)
    };
  }
  
  return this.find(query)
    .populate('doctor', 'firstName lastName speciality')
    .populate('patient', 'firstName lastName patientId phone')
    .populate('appointment', 'date time')
    .sort({ prescribedAt: -1 });
};

// Method to check if prescription is valid
prescriptionSchema.methods.isValid = function() {
  return this.isActive && this.validUntil >= new Date();
};

module.exports = mongoose.model('Prescription', prescriptionSchema);

