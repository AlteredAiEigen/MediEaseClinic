const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const ClinicalNote = require('../models/ClinicalNote');
const Recording = require('../models/Recording');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');

// Get admin dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get basic counts
    const totalPatients = await Patient.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const totalReceptionists = await User.countDocuments({ role: 'receptionist' });
    const totalClinicalNotes = await ClinicalNote.countDocuments();
    const totalRecordings = await Recording.countDocuments();

    // Get appointments for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointmentsToday = await Appointment.countDocuments({
      appointmentDate: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Get patients this month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const patientsThisMonth = await Patient.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Get recent activity (last 10 activities)
    const recentAppointments = await Appointment.find()
      .populate('patient', 'firstName lastName')
      .populate('doctor', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentPatients = await Patient.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const recentActivity = [
      ...recentAppointments.map(apt => ({
        type: 'appointment',
        description: `Appointment scheduled for ${apt.patient.firstName} ${apt.patient.lastName}`,
        date: apt.createdAt,
        user: `${apt.doctor.firstName} ${apt.doctor.lastName}`
      })),
      ...recentPatients.map(patient => ({
        type: 'patient',
        description: `New patient registered: ${patient.firstName} ${patient.lastName}`,
        date: patient.createdAt,
        user: 'System'
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    const dashboard = {
      totalPatients,
      totalAppointments,
      totalDoctors,
      totalReceptionists,
      totalClinicalNotes,
      totalRecordings,
      appointmentsToday,
      patientsThisMonth,
      recentActivity
    };

    sendSuccess(res, 'Dashboard statistics retrieved successfully', dashboard);
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    sendError(res, 'Failed to retrieve dashboard statistics', error.message);
  }
};

// Get system statistics
const getSystemStats = async (req, res) => {
  try {
    // Get patient statistics
    const patientsByGender = await Patient.aggregate([
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);

    const patientsByAgeGroup = await Patient.aggregate([
      {
        $addFields: {
          ageGroup: {
            $switch: {
              branches: [
                { case: { $lt: ['$age', 18] }, then: '0-17' },
                { case: { $lt: ['$age', 30] }, then: '18-29' },
                { case: { $lt: ['$age', 50] }, then: '30-49' },
                { case: { $lt: ['$age', 65] }, then: '50-64' },
                { case: { $gte: ['$age', 65] }, then: '65+' }
              ],
              default: 'Unknown'
            }
          }
        }
      },
      { $group: { _id: '$ageGroup', count: { $sum: 1 } } }
    ]);

    // Get appointment statistics
    const appointmentsByStatus = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const appointmentsByMonth = await Appointment.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get clinical notes statistics
    const notesByCategory = await ClinicalNote.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const notesByPriority = await ClinicalNote.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Get recording statistics
    const recordingsByStatus = await Recording.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const totalRecordingDuration = await Recording.aggregate([
      { $group: { _id: null, totalDuration: { $sum: '$duration' } } }
    ]);

    // Get user statistics
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // System health metrics
    const systemHealth = {
      database: 'connected',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version
    };

    const stats = {
      patients: {
        byGender: patientsByGender,
        byAgeGroup: patientsByAgeGroup
      },
      appointments: {
        byStatus: appointmentsByStatus,
        byMonth: appointmentsByMonth
      },
      clinicalNotes: {
        byCategory: notesByCategory,
        byPriority: notesByPriority
      },
      recordings: {
        byStatus: recordingsByStatus,
        totalDuration: totalRecordingDuration[0]?.totalDuration || 0
      },
      users: {
        byRole: usersByRole
      },
      systemHealth
    };

    sendSuccess(res, 'System statistics retrieved successfully', stats);
  } catch (error) {
    console.error('Error getting system stats:', error);
    sendError(res, 'Failed to retrieve system statistics', error.message);
  }
};

// Get all users
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get users
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await User.countDocuments(query);

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

    sendSuccess(res, 'Users retrieved successfully', {
      users,
      pagination
    });
  } catch (error) {
    console.error('Error getting users:', error);
    sendError(res, 'Failed to retrieve users', error.message);
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const userData = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return sendError(res, 'User with this email already exists', null, 400);
    }

    // Create user
    const user = new User(userData);
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    sendSuccess(res, 'User created successfully', { user: userResponse }, 201);
  } catch (error) {
    console.error('Error creating user:', error);
    sendError(res, 'Failed to create user', error.message);
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove password from update data if present
    delete updateData.password;

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    sendSuccess(res, 'User updated successfully', { user });
  } catch (error) {
    console.error('Error updating user:', error);
    sendError(res, 'Failed to update user', error.message);
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    // Check if trying to delete own account
    if (user._id.toString() === req.user.id) {
      return sendError(res, 'Cannot delete your own account', null, 400);
    }

    // Check if user has any appointments
    const appointmentsCount = await Appointment.countDocuments({ 
      $or: [
        { doctor: id },
        { scheduledBy: id }
      ]
    });
    
    if (appointmentsCount > 0) {
      return sendError(res, 'Cannot delete user with existing appointments', null, 400);
    }

    await User.findByIdAndDelete(id);

    sendSuccess(res, 'User deleted successfully');
  } catch (error) {
    console.error('Error deleting user:', error);
    sendError(res, 'Failed to delete user', error.message);
  }
};

// Get all patients for admin
const getPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } }
      ];
    }

    // Get patients
    const patients = await Patient.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Patient.countDocuments(query);

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

    sendSuccess(res, 'Patients retrieved successfully', {
      patients,
      pagination
    });
  } catch (error) {
    console.error('Error getting patients:', error);
    sendError(res, 'Failed to retrieve patients', error.message);
  }
};

// Get all appointments for admin
const getAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, doctor } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (doctor) {
      query.doctor = doctor;
    }

    // Get appointments
    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName patientId')
      .populate('doctor', 'firstName lastName speciality')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Appointment.countDocuments(query);

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

    sendSuccess(res, 'Appointments retrieved successfully', {
      appointments,
      pagination
    });
  } catch (error) {
    console.error('Error getting appointments:', error);
    sendError(res, 'Failed to retrieve appointments', error.message);
  }
};

// Get all clinical notes for admin
const getClinicalNotes = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, priority } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (type) {
      query.type = type;
    }
    
    if (priority) {
      query.priority = priority;
    }

    // Get clinical notes
    const clinicalNotes = await ClinicalNote.find(query)
      .populate('patient', 'firstName lastName patientId')
      .populate('doctor', 'firstName lastName speciality')
      .populate('appointment', 'appointmentId date time')
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
      clinicalNotes,
      pagination
    });
  } catch (error) {
    console.error('Error getting clinical notes:', error);
    sendError(res, 'Failed to retrieve clinical notes', error.message);
  }
};

// Get all recordings for admin
const getRecordings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, doctor } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (doctor) {
      query.doctor = doctor;
    }

    // Get recordings
    const recordings = await Recording.find(query)
      .populate('patient', 'firstName lastName patientId')
      .populate('doctor', 'firstName lastName speciality')
      .populate('appointment', 'appointmentId date time')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Recording.countDocuments(query);

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

    sendSuccess(res, 'Recordings retrieved successfully', {
      recordings,
      pagination
    });
  } catch (error) {
    console.error('Error getting recordings:', error);
    sendError(res, 'Failed to retrieve recordings', error.message);
  }
};

module.exports = {
  getDashboardStats,
  getSystemStats,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getPatients,
  getAppointments,
  getClinicalNotes,
  getRecordings
};
