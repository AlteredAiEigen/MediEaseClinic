const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    unique: true,
    required: true,
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
  scheduledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Scheduled by is required']
  },
  date: {
    type: String,
    required: [true, 'Appointment date is required'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format']
  },
  time: {
    type: String,
    required: [true, 'Appointment time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [15, 'Duration must be at least 15 minutes'],
    max: [480, 'Duration cannot exceed 8 hours'],
    default: 30
  },
  status: {
    type: String,
    enum: ['scheduled', 'checked-in', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  reason: {
    type: String,
    required: [true, 'Appointment reason is required'],
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  notes: {
    type: String,
    default: '',
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  presentInClinic: {
    type: Boolean,
    default: false
  },
  insurance: {
    type: Boolean,
    default: false
  },
  checkedInAt: Date,
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: String,
  followUpNotes: String,
  // Virtual fields for patient and doctor names
  patientName: String,
  doctorName: String,
  scheduledByName: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
appointmentSchema.index({ appointmentId: 1 });
appointmentSchema.index({ patient: 1 });
appointmentSchema.index({ doctor: 1 });
appointmentSchema.index({ date: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ date: 1, time: 1 });
appointmentSchema.index({ doctor: 1, date: 1 });

// Pre-save middleware to generate appointment ID
appointmentSchema.pre('save', function(next) {
  if (!this.appointmentId) {
    const timestamp = Date.now().toString().slice(-8);
    this.appointmentId = `APT${timestamp}`;
  }
  next();
});

// Pre-save middleware to populate names
appointmentSchema.pre('save', async function(next) {
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
    
    if (this.isModified('scheduledBy') && this.scheduledBy) {
      const scheduler = await mongoose.model('User').findById(this.scheduledBy);
      if (scheduler) {
        this.scheduledByName = `${scheduler.firstName} ${scheduler.lastName}`;
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to check time slot conflicts
appointmentSchema.statics.checkTimeSlotConflict = async function(doctorId, date, time, duration, excludeAppointmentId = null) {
  const appointmentTime = new Date(`${date}T${time}`);
  const appointmentEnd = new Date(appointmentTime.getTime() + duration * 60000);
  
  const query = {
    doctor: doctorId,
    date: date,
    status: { $nin: ['cancelled', 'no-show'] },
    $or: [
      {
        $expr: {
          $and: [
            { $gte: [new Date(`$dateT$time`), appointmentTime] },
            { $lt: [new Date(`$dateT$time`), appointmentEnd] }
          ]
        }
      },
      {
        $expr: {
          $and: [
            { $gt: [{ $add: [new Date(`$dateT$time`), { $multiply: ['$duration', 60000] }] }, appointmentTime] },
            { $lte: [{ $add: [new Date(`$dateT$time`), { $multiply: ['$duration', 60000] }] }, appointmentEnd] }
          ]
        }
      },
      {
        $expr: {
          $and: [
            { $lte: [new Date(`$dateT$time`), appointmentTime] },
            { $gte: [{ $add: [new Date(`$dateT$time`), { $multiply: ['$duration', 60000] }] }, appointmentEnd] }
          ]
        }
      }
    ]
  };
  
  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }
  
  const conflict = await this.findOne(query);
  return !!conflict;
};

// Static method to get appointments by date range
appointmentSchema.statics.getAppointmentsByDateRange = function(startDate, endDate, doctorId = null) {
  const query = {
    date: { $gte: startDate, $lte: endDate }
  };
  
  if (doctorId) {
    query.doctor = doctorId;
  }
  
  return this.find(query)
    .populate('patient', 'firstName lastName patientId phone email')
    .populate('doctor', 'firstName lastName speciality')
    .populate('scheduledBy', 'firstName lastName')
    .sort({ date: 1, time: 1 });
};

// Static method to get doctor availability
appointmentSchema.statics.getDoctorAvailability = async function(doctorId, date) {
  const appointments = await this.find({
    doctor: doctorId,
    date: date,
    status: { $nin: ['cancelled', 'no-show'] }
  }).sort({ time: 1 });
  
  const timeSlots = [];
  const startHour = 9;
  const endHour = 17;
  const slotDuration = 30;
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minutes = 0; minutes < 60; minutes += slotDuration) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const slotTime = new Date(`${date}T${timeString}`);
      const slotEnd = new Date(slotTime.getTime() + slotDuration * 60000);
      
      const hasConflict = appointments.some(apt => {
        const aptTime = new Date(`${apt.date}T${apt.time}`);
        const aptEnd = new Date(aptTime.getTime() + apt.duration * 60000);
        
        return (slotTime >= aptTime && slotTime < aptEnd) ||
               (slotEnd > aptTime && slotEnd <= aptEnd) ||
               (slotTime <= aptTime && slotEnd >= aptEnd);
      });
      
      timeSlots.push({
        time: timeString,
        available: !hasConflict,
        appointmentId: hasConflict ? appointments.find(apt => {
          const aptTime = new Date(`${apt.date}T${apt.time}`);
          const aptEnd = new Date(aptTime.getTime() + apt.duration * 60000);
          return (slotTime >= aptTime && slotTime < aptEnd) ||
                 (slotEnd > aptTime && slotEnd <= aptEnd) ||
                 (slotTime <= aptTime && slotEnd >= aptEnd);
        })?.appointmentId : null
      });
    }
  }
  
  return {
    doctorId,
    date,
    startTime: `${startHour.toString().padStart(2, '0')}:00`,
    endTime: `${endHour.toString().padStart(2, '0')}:00`,
    isAvailable: timeSlots.some(slot => slot.available),
    timeSlots
  };
};

module.exports = mongoose.model('Appointment', appointmentSchema);
