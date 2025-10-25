const Queue = require('../models/Queue');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { validationResult } = require('express-validator');

// @desc    Check in patient
// @route   POST /api/queue/check-in
// @access  Private (Receptionist, Admin)
const checkInPatient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { patientId, doctorId, appointmentId, reason, priority, notes } = req.body;

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check if patient is already in queue
    const existingQueue = await Queue.findOne({
      patient: patientId,
      status: { $in: ['waiting', 'in-consultation'] },
      isActive: true
    });

    if (existingQueue) {
      return res.status(400).json({
        success: false,
        message: 'Patient is already in the queue',
        data: existingQueue
      });
    }

    // Create queue entry
    const queueEntry = await Queue.create({
      patient: patientId,
      doctor: doctorId,
      appointment: appointmentId || null,
      checkedInBy: req.user.id,
      reason: reason || 'General Consultation',
      priority: priority || 'medium',
      notes: notes || ''
    });

    // Populate the created entry
    await queueEntry.populate([
      { path: 'patient', select: 'firstName lastName patientId phone age gender' },
      { path: 'doctor', select: 'firstName lastName speciality' },
      { path: 'appointment' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Patient checked in successfully',
      data: queueEntry
    });
  } catch (error) {
    console.error('Check in patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check in patient',
      error: error.message
    });
  }
};

// @desc    Get current queue
// @route   GET /api/queue
// @access  Private (Receptionist, Doctor, Admin)
const getQueue = async (req, res) => {
  try {
    const queue = await Queue.getActiveQueue();

    res.status(200).json({
      success: true,
      count: queue.length,
      data: {
        queue
      }
    });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch queue',
      error: error.message
    });
  }
};

// @desc    Get queue for specific doctor
// @route   GET /api/queue/doctor/:doctorId
// @access  Private (Doctor, Receptionist, Admin)
const getDoctorQueue = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const queue = await Queue.getTodayQueue(doctorId);

    res.status(200).json({
      success: true,
      count: queue.length,
      data: {
        queue
      }
    });
  } catch (error) {
    console.error('Get doctor queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor queue',
      error: error.message
    });
  }
};

// @desc    Get single queue entry
// @route   GET /api/queue/:id
// @access  Private (Doctor, Receptionist, Admin)
const getQueueEntry = async (req, res) => {
  try {
    const queueEntry = await Queue.findById(req.params.id)
      .populate('patient', 'firstName lastName patientId phone age gender')
      .populate('doctor', 'firstName lastName speciality')
      .populate('appointment');

    if (!queueEntry) {
      return res.status(404).json({
        success: false,
        message: 'Queue entry not found'
      });
    }

    res.status(200).json({
      success: true,
      data: queueEntry
    });
  } catch (error) {
    console.error('Get queue entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch queue entry',
      error: error.message
    });
  }
};

// @desc    Update queue status
// @route   PUT /api/queue/:id/status
// @access  Private (Doctor, Receptionist, Admin)
const updateQueueStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['waiting', 'in-consultation', 'completed', 'checked-out', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const queueEntry = await Queue.findById(req.params.id);

    if (!queueEntry) {
      return res.status(404).json({
        success: false,
        message: 'Queue entry not found'
      });
    }

    queueEntry.status = status;

    // Handle special status updates
    if (status === 'in-consultation' && !queueEntry.consultationStartedAt) {
      queueEntry.consultationStartedAt = new Date();
    } else if (status === 'completed' && !queueEntry.consultationEndedAt) {
      queueEntry.consultationEndedAt = new Date();
      
      // Calculate wait time
      if (queueEntry.consultationStartedAt && queueEntry.checkedInAt) {
        const diffMs = queueEntry.consultationStartedAt - queueEntry.checkedInAt;
        queueEntry.waitTime = Math.round(diffMs / 60000);
      }
    } else if (status === 'checked-out') {
      queueEntry.isActive = false;
    }

    await queueEntry.save();

    await queueEntry.populate([
      { path: 'patient', select: 'firstName lastName patientId phone age gender' },
      { path: 'doctor', select: 'firstName lastName speciality' },
      { path: 'appointment' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Queue status updated successfully',
      data: queueEntry
    });
  } catch (error) {
    console.error('Update queue status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update queue status',
      error: error.message
    });
  }
};

// @desc    Start consultation
// @route   PUT /api/queue/:id/start-consultation
// @access  Private (Doctor)
const startConsultation = async (req, res) => {
  try {
    const queueEntry = await Queue.findById(req.params.id);

    if (!queueEntry) {
      return res.status(404).json({
        success: false,
        message: 'Queue entry not found'
      });
    }

    await queueEntry.startConsultation();

    await queueEntry.populate([
      { path: 'patient', select: 'firstName lastName patientId phone age gender' },
      { path: 'doctor', select: 'firstName lastName speciality' },
      { path: 'appointment' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Consultation started',
      data: queueEntry
    });
  } catch (error) {
    console.error('Start consultation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start consultation',
      error: error.message
    });
  }
};

// @desc    Check out patient
// @route   POST /api/queue/:id/check-out
// @access  Private (Receptionist, Admin)
const checkOutPatient = async (req, res) => {
  try {
    const queueEntry = await Queue.findById(req.params.id);

    if (!queueEntry) {
      return res.status(404).json({
        success: false,
        message: 'Queue entry not found'
      });
    }

    await queueEntry.checkOut();

    await queueEntry.populate([
      { path: 'patient', select: 'firstName lastName patientId phone age gender' },
      { path: 'doctor', select: 'firstName lastName speciality' },
      { path: 'appointment' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Patient checked out successfully',
      data: queueEntry
    });
  } catch (error) {
    console.error('Check out patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check out patient',
      error: error.message
    });
  }
};

// @desc    Get queue statistics
// @route   GET /api/queue/stats
// @access  Private (Admin)
const getQueueStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalPatientsToday = await Queue.countDocuments({
      checkedInAt: { $gte: today },
      isActive: true
    });

    const currentWaiting = await Queue.countDocuments({
      status: 'waiting',
      isActive: true
    });

    const inConsultation = await Queue.countDocuments({
      status: 'in-consultation',
      isActive: true
    });

    const completed = await Queue.countDocuments({
      checkedInAt: { $gte: today },
      status: { $in: ['completed', 'checked-out'] }
    });

    // Average wait time
    const avgWaitTime = await Queue.aggregate([
      {
        $match: {
          checkedInAt: { $gte: today },
          waitTime: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          avgWaitTime: { $avg: '$waitTime' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPatientsToday,
        currentWaiting,
        inConsultation,
        completed,
        averageWaitTime: avgWaitTime.length > 0 ? Math.round(avgWaitTime[0].avgWaitTime) : 0
      }
    });
  } catch (error) {
    console.error('Get queue stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch queue statistics',
      error: error.message
    });
  }
};

module.exports = {
  checkInPatient,
  getQueue,
  getDoctorQueue,
  getQueueEntry,
  updateQueueStatus,
  startConsultation,
  checkOutPatient,
  getQueueStats
};

