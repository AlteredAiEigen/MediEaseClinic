const mongoose = require('mongoose');

const vitalsSchema = new mongoose.Schema({
  bloodPressure: String,
  heartRate: String,
  temperature: String,
  oxygenSaturation: String,
  weight: String,
  height: String,
  bmi: String
}, { _id: false });

const lifestyleSchema = new mongoose.Schema({
  smoking: String,
  alcohol: String,
  exercise: String,
  diet: String,
  sleep: String,
  stress: String
}, { _id: false });

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: false, // Will be auto-generated
    uppercase: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Gender is required']
  },
  age: {
    type: String,
    required: [true, 'Age is required']
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: [true, 'Blood group is required']
  },
  dateOfBirth: {
    type: String,
    required: [true, 'Date of birth is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  vitals: {
    type: vitalsSchema,
    default: () => ({})
  },
  medicalHistory: {
    type: String,
    default: ''
  },
  allergies: {
    type: String,
    default: ''
  },
  familyHistory: {
    type: String,
    default: ''
  },
  previousSurgeries: {
    type: String,
    default: ''
  },
  currentMedication: {
    type: String,
    default: ''
  },
  medicationDosage: String,
  medicationFrequency: String,
  lastMedicationReview: String,
  lifestyle: {
    type: lifestyleSchema,
    default: () => ({})
  },
  chiefComplaint: String,
  currentSymptoms: String,
  painLevel: String,
  durationOfSymptoms: String,
  carePlan: String,
  treatmentGoals: String,
  followUpSchedule: String,
  doctorNotes: String,
  diagnosis: String,
  treatmentPlan: String,
  recommendations: String,
  userName: String,
  portalPassword: String,
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  insurance: {
    provider: String,
    policyNumber: String,
    groupNumber: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
patientSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for appointment history
patientSchema.virtual('appointmentHistory', {
  ref: 'Appointment',
  localField: '_id',
  foreignField: 'patient',
  options: { sort: { date: -1, time: -1 } }
});

// Indexes for better query performance
patientSchema.index({ patientId: 1 }, { unique: true });
patientSchema.index({ email: 1 });
patientSchema.index({ phone: 1 });
patientSchema.index({ firstName: 1, lastName: 1 });
patientSchema.index({ isActive: 1 });

// Pre-save middleware to generate patient ID
patientSchema.pre('save', function(next) {
  if (!this.patientId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.patientId = `P${timestamp}${random}`;
  }
  next();
});

// Static method to search patients
patientSchema.statics.searchPatients = function(query) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    $or: [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { patientId: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { fullName: searchRegex }
    ],
    isActive: true
  }).sort({ updatedAt: -1 });
};

// Static method to find by patient ID
patientSchema.statics.findByPatientId = function(patientId) {
  return this.findOne({ patientId: patientId.toUpperCase() });
};

module.exports = mongoose.model('Patient', patientSchema);
