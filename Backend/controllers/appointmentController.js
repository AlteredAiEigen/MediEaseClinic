const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { doctor, patient, status, date, startDate, endDate } = req.query;

    let query = {};

    // Role-based filtering
    if (req.user.role === 'doctor') {
      // Doctors can only see their own appointments unless they provide a different doctor ID
      query.doctor = doctor || req.user.id;
    } else if (req.user.role === 'receptionist') {
      // Receptionists can see all appointments but can filter by doctor
      if (doctor) {
        query.doctor = doctor;
      }
    } else {
      // Admin can see all appointments, can filter by doctor
      if (doctor) {
        query.doctor = doctor;
      }
    }

    // Filter by patient
    if (patient) {
      query.patient = patient;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by specific date
    if (date) {
      query.date = date;
    }

    // Filter by date range
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName patientId phone email')
      .populate('doctor', 'firstName lastName speciality')
      .populate('scheduledBy', 'firstName lastName')
      .sort({ date: 1, time: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      data: appointments
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
const getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'firstName lastName patientId phone email')
      .populate('doctor', 'firstName lastName speciality')
      .populate('scheduledBy', 'firstName lastName');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        appointment
      }
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment',
      error: error.message
    });
  }
};

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private (Receptionist, Admin)
const createAppointment = async (req, res) => {
  try {
    const { patient, doctor, date, time, duration, reason, priority, notes } = req.body;

    // Manual validation
    if (!patient || typeof patient !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required'
      });
    }

    if (!doctor || typeof doctor !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required'
      });
    }

    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Date must be in YYYY-MM-DD format'
      });
    }

    if (!time || !time.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      return res.status(400).json({
        success: false,
        message: 'Time must be in HH:MM format'
      });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      });
    }

    if (reason.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Reason cannot exceed 500 characters'
      });
    }

    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Priority must be low, medium, or high'
      });
    }

    if (notes && notes.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Notes cannot exceed 1000 characters'
      });
    }

    // Check if patient ID is valid ObjectId
    if (!patient.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check if doctor ID is valid ObjectId
    if (!doctor.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check if patient exists
    const patientExists = await Patient.findById(patient);
    if (!patientExists) {
      return res.status(400).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check if doctor exists
    const doctorExists = await User.findById(doctor);
    if (!doctorExists || doctorExists.role !== 'doctor') {
      return res.status(400).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check for time slot conflicts
    const hasConflict = await Appointment.checkTimeSlotConflict(
      doctor,
      date,
      time,
      duration || 30
    );

    if (hasConflict) {
      return res.status(400).json({
        success: false,
        message: 'Time slot is already booked for this doctor'
      });
    }

    // Generate appointment ID
    const timestamp = Date.now().toString().slice(-8);
    const appointmentId = `APT${timestamp}`;

    const appointment = await Appointment.create({
      appointmentId,
      patient,
      doctor,
      scheduledBy: req.user.id,
      date,
      time,
      duration: duration || 30,
      reason,
      priority: priority || 'medium',
      notes: notes || ''
    });

    // Populate the created appointment
    await appointment.populate([
      { path: 'patient', select: 'firstName lastName patientId phone email' },
      { path: 'doctor', select: 'firstName lastName speciality' },
      { path: 'scheduledBy', select: 'firstName lastName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: {
        appointment
      }
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment',
      error: error.message
    });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { doctor, date, time, appointmentTime, duration, reason, priority, notes, status } = req.body;
    
    // Map appointmentTime to time if provided
    const actualTime = appointmentTime || time;

    // Check for time slot conflicts if time/date/duration is being changed
    if (doctor || date || actualTime || duration) {
      const currentAppointment = await Appointment.findById(req.params.id);
      if (!currentAppointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      const hasConflict = await Appointment.checkTimeSlotConflict(
        doctor || currentAppointment.doctor,
        date || currentAppointment.date,
        actualTime || currentAppointment.time,
        duration || currentAppointment.duration,
        req.params.id
      );

      if (hasConflict) {
        return res.status(400).json({
          success: false,
          message: 'Time slot is already booked for this doctor'
        });
      }
    }

    // Prepare update data with proper field mapping
    const updateData = { ...req.body };
    if (appointmentTime) {
      updateData.time = appointmentTime;
      delete updateData.appointmentTime;
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('patient', 'firstName lastName patientId phone email')
      .populate('doctor', 'firstName lastName speciality')
      .populate('scheduledBy', 'firstName lastName');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Transform response to include appointmentTime field
    const appointmentResponse = appointment.toObject();
    appointmentResponse.appointmentTime = appointmentResponse.time;

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: {
        appointment: appointmentResponse
      }
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment',
      error: error.message
    });
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['scheduled', 'checked-in', 'in-progress', 'completed', 'cancelled', 'no-show'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed'
      });
    }

    const updateData = { status };

    // Add timestamps for status changes
    switch (status) {
      case 'checked-in':
        updateData.checkedInAt = new Date();
        break;
      case 'in-progress':
        updateData.startedAt = new Date();
        break;
      case 'completed':
        updateData.completedAt = new Date();
        break;
      case 'cancelled':
        updateData.cancelledAt = new Date();
        break;
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('patient', 'firstName lastName patientId phone email')
      .populate('doctor', 'firstName lastName speciality')
      .populate('scheduledBy', 'firstName lastName');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment status updated successfully',
      data: {
        appointment
      }
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment status',
      error: error.message
    });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private (Admin, Receptionist)
const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete appointment',
      error: error.message
    });
  }
};

// @desc    Get appointment statistics
// @route   GET /api/appointments/stats
// @access  Private
const getAppointmentStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const totalAppointments = await Appointment.countDocuments();
    const todayAppointments = await Appointment.countDocuments({ date: today });
    const completedToday = await Appointment.countDocuments({ 
      date: today, 
      status: 'completed' 
    });
    const cancelledToday = await Appointment.countDocuments({ 
      date: today, 
      status: 'cancelled' 
    });

    const appointmentsByStatus = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const appointmentsByDoctor = await Appointment.aggregate([
      { $group: { _id: '$doctor', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'doctor' } },
      { $unwind: '$doctor' },
      { $project: { doctorName: { $concat: ['$doctor.firstName', ' ', '$doctor.lastName'] }, count: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalAppointments,
        todayAppointments,
        appointmentsToday: todayAppointments, // Add alias for test compatibility
        completedToday,
        cancelledToday,
        appointmentsByStatus,
        appointmentsByDoctor
      }
    });
  } catch (error) {
    console.error('Get appointment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment statistics',
      error: error.message
    });
  }
};

// @desc    Get doctor availability
// @route   GET /api/appointments/availability/:doctorId
// @access  Private
const getDoctorAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    // Check if doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Get existing appointments for the date
    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      date: targetDate,
      status: { $in: ['scheduled', 'checked-in', 'in-progress'] }
    }).select('time duration');

    // Generate all possible time slots (9 AM to 5 PM, 30-minute slots)
    const allSlots = [];
    const availableSlots = [];
    const unavailableSlots = [];
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        allSlots.push(timeSlot);
        
        // Check if this slot conflicts with existing appointments
        const hasConflict = existingAppointments.some(apt => {
          const aptStart = apt.time;
          const aptEnd = new Date(`2000-01-01T${aptStart}`);
          aptEnd.setMinutes(aptEnd.getMinutes() + apt.duration);
          const aptEndTime = aptEnd.toTimeString().slice(0, 5);
          
          const slotStart = new Date(`2000-01-01T${timeSlot}`);
          const slotEnd = new Date(slotStart.getTime() + 30 * 60000);
          const slotEndTime = slotEnd.toTimeString().slice(0, 5);
          
          return (timeSlot >= aptStart && timeSlot < aptEndTime) ||
                 (slotEndTime > aptStart && slotEndTime <= aptEndTime);
        });
        
        if (!hasConflict) {
          availableSlots.push(timeSlot);
        } else {
          unavailableSlots.push(timeSlot);
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        doctor: {
          id: doctor._id,
          name: `${doctor.firstName} ${doctor.lastName}`,
          speciality: doctor.speciality
        },
        date: targetDate,
        availableSlots,
        unavailableSlots,
        totalSlots: availableSlots.length
      }
    });
  } catch (error) {
    console.error('Get doctor availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor availability',
      error: error.message
    });
  }
};

// @desc    Get appointments by date range
// @route   GET /api/appointments/date-range
// @access  Private
const getAppointmentsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const appointments = await Appointment.find({
      date: { $gte: startDate, $lte: endDate }
    })
      .populate('patient', 'firstName lastName patientId phone email')
      .populate('doctor', 'firstName lastName speciality')
      .populate('scheduledBy', 'firstName lastName')
      .sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: {
        appointments
      }
    });
  } catch (error) {
    console.error('Get appointments by date range error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments by date range',
      error: error.message
    });
  }
};

module.exports = {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  getDoctorAvailability,
  getAppointmentsByDateRange,
  getAppointmentStats
};
