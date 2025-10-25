const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  queueId: {
    type: String,
    required: false, // Will be auto-generated
    uppercase: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient is required']
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor is required']
  },
  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  checkedInAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['waiting', 'in-consultation', 'completed', 'checked-out', 'cancelled'],
    default: 'waiting'
  },
  queueNumber: {
    type: Number,
    required: false // Will be auto-generated
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'emergency'],
    default: 'medium'
  },
  reason: {
    type: String,
    default: 'General Consultation'
  },
  notes: {
    type: String,
    default: ''
  },
  consultationStartedAt: Date,
  consultationEndedAt: Date,
  waitTime: {
    type: Number, // in minutes
    default: 0
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

// Indexes
queueSchema.index({ queueId: 1 }, { unique: true });
queueSchema.index({ patient: 1 });
queueSchema.index({ doctor: 1 });
queueSchema.index({ status: 1 });
queueSchema.index({ queueNumber: 1 });
queueSchema.index({ checkedInAt: 1 });
queueSchema.index({ isActive: 1 });

// Pre-save middleware to generate queue ID
queueSchema.pre('save', async function(next) {
  if (!this.queueId) {
    const timestamp = Date.now().toString().slice(-8);
    this.queueId = `Q${timestamp}`;
  }
  
  // Auto-generate queue number if not provided
  if (!this.queueNumber) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const count = await this.constructor.countDocuments({
      doctor: this.doctor,
      createdAt: { $gte: today }
    });
    
    this.queueNumber = count + 1;
  }
  
  next();
});

// Method to start consultation
queueSchema.methods.startConsultation = function() {
  this.status = 'in-consultation';
  this.consultationStartedAt = new Date();
  return this.save();
};

// Method to end consultation
queueSchema.methods.endConsultation = function() {
  this.status = 'completed';
  this.consultationEndedAt = new Date();
  
  // Calculate wait time
  if (this.consultationStartedAt && this.checkedInAt) {
    const diffMs = this.consultationStartedAt - this.checkedInAt;
    this.waitTime = Math.round(diffMs / 60000); // Convert to minutes
  }
  
  return this.save();
};

// Method to check out patient
queueSchema.methods.checkOut = function() {
  this.status = 'checked-out';
  this.isActive = false;
  return this.save();
};

// Static method to get today's queue for a doctor
queueSchema.statics.getTodayQueue = function(doctorId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.find({
    doctor: doctorId,
    checkedInAt: {
      $gte: today,
      $lt: tomorrow
    },
    isActive: true
  })
  .populate('patient', 'firstName lastName patientId phone age gender')
  .populate('doctor', 'firstName lastName speciality')
  .populate('appointment')
  .sort({ queueNumber: 1 });
};

// Static method to get active queue for clinic
queueSchema.statics.getActiveQueue = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.find({
    checkedInAt: { $gte: today },
    status: { $in: ['waiting', 'in-consultation'] },
    isActive: true
  })
  .populate('patient', 'firstName lastName patientId phone age gender')
  .populate('doctor', 'firstName lastName speciality')
  .populate('appointment')
  .sort({ priority: -1, queueNumber: 1 });
};

module.exports = mongoose.model('Queue', queueSchema);

