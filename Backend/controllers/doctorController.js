const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const ClinicalNote = require('../models/ClinicalNote');

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Private
const getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor', isActive: true })
      .select('-password')
      .sort({ firstName: 1 });

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors',
      error: error.message
    });
  }
};

// @desc    Get single doctor
// @route   GET /api/doctors/:id
// @access  Private
const getDoctor = async (req, res) => {
  try {
    const doctor = await User.findOne({ 
      _id: req.params.id, 
      role: 'doctor' 
    }).select('-password');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor',
      error: error.message
    });
  }
};

// @desc    Update doctor
// @route   PUT /api/doctors/:id
// @access  Private (Admin)
const updateDoctor = async (req, res) => {
  try {
    const doctor = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'doctor' },
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      data: doctor
    });
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update doctor',
      error: error.message
    });
  }
};

// @desc    Delete doctor
// @route   DELETE /api/doctors/:id
// @access  Private (Admin)
const deleteDoctor = async (req, res) => {
  try {
    const doctor = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'doctor' },
      { isActive: false },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Doctor deleted successfully'
    });
  } catch (error) {
    console.error('Delete doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete doctor',
      error: error.message
    });
  }
};

// @desc    Get doctor statistics
// @route   GET /api/doctors/stats
// @access  Private
const getDoctorStats = async (req, res) => {
  try {
    const doctorId = req.user.role === 'doctor' ? req.user.id : req.query.doctorId;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required'
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    // Get appointment statistics
    const totalAppointments = await Appointment.countDocuments({ doctor: doctorId });
    const todayAppointments = await Appointment.countDocuments({ 
      doctor: doctorId, 
      date: today 
    });
    const thisMonthAppointments = await Appointment.countDocuments({
      doctor: doctorId,
      createdAt: { $gte: thisMonth }
    });

    // Get patient statistics
    const uniquePatients = await Appointment.distinct('patient', { doctor: doctorId });
    const totalPatients = uniquePatients.length;

    // Get clinical notes statistics
    const totalNotes = await ClinicalNote.countDocuments({ doctor: doctorId });
    const actionableNotes = await ClinicalNote.countDocuments({ 
      doctor: doctorId, 
      actionable: true, 
      completed: false 
    });

    // Get recent appointments
    const recentAppointments = await Appointment.find({ doctor: doctorId })
      .populate('patient', 'firstName lastName patientId')
      .sort({ date: -1, time: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalAppointments,
        todayAppointments,
        thisMonthAppointments,
        totalPatients,
        totalNotes,
        actionableNotes,
        recentAppointments
      }
    });
  } catch (error) {
    console.error('Get doctor stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor statistics',
      error: error.message
    });
  }
};

module.exports = {
  getDoctors,
  getDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorStats
};
