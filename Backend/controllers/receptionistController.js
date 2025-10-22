const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');

// Get all receptionists
const getReceptionists = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = { role: 'receptionist' };
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get receptionists
    const receptionists = await User.find(query)
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

    sendSuccess(res, 'Receptionists retrieved successfully', {
      receptionists,
      pagination
    });
  } catch (error) {
    console.error('Error getting receptionists:', error);
    sendError(res, 'Failed to retrieve receptionists', error.message);
  }
};

// Get single receptionist
const getReceptionist = async (req, res) => {
  try {
    const { id } = req.params;

    const receptionist = await User.findOne({ _id: id, role: 'receptionist' })
      .select('-password');

    if (!receptionist) {
      return sendNotFound(res, 'Receptionist not found');
    }

    sendSuccess(res, 'Receptionist retrieved successfully', { receptionist });
  } catch (error) {
    console.error('Error getting receptionist:', error);
    sendError(res, 'Failed to retrieve receptionist', error.message);
  }
};

// Update receptionist
const updateReceptionist = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove password from update data if present
    delete updateData.password;

    const receptionist = await User.findOneAndUpdate(
      { _id: id, role: 'receptionist' },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!receptionist) {
      return sendNotFound(res, 'Receptionist not found');
    }

    sendSuccess(res, 'Receptionist updated successfully', { receptionist });
  } catch (error) {
    console.error('Error updating receptionist:', error);
    sendError(res, 'Failed to update receptionist', error.message);
  }
};

// Delete receptionist
const deleteReceptionist = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if receptionist exists
    const receptionist = await User.findOne({ _id: id, role: 'receptionist' });
    if (!receptionist) {
      return sendNotFound(res, 'Receptionist not found');
    }

    // Check if receptionist has any appointments
    const appointmentsCount = await Appointment.countDocuments({ scheduledBy: id });
    if (appointmentsCount > 0) {
      return sendError(res, 'Cannot delete receptionist with existing appointments', null, 400);
    }

    await User.findByIdAndDelete(id);

    sendSuccess(res, 'Receptionist deleted successfully');
  } catch (error) {
    console.error('Error deleting receptionist:', error);
    sendError(res, 'Failed to delete receptionist', error.message);
  }
};

// Get receptionist statistics
const getReceptionistStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if receptionist exists
    const receptionist = await User.findOne({ _id: id, role: 'receptionist' });
    if (!receptionist) {
      return sendNotFound(res, 'Receptionist not found');
    }

    // Get statistics
    const totalAppointments = await Appointment.countDocuments({ scheduledBy: id });
    const appointmentsToday = await Appointment.countDocuments({
      scheduledBy: id,
      appointmentDate: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lt: new Date().setHours(23, 59, 59, 999)
      }
    });
    const appointmentsThisMonth = await Appointment.countDocuments({
      scheduledBy: id,
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
      }
    });

    const appointmentsByStatus = await Appointment.aggregate([
      { $match: { scheduledBy: id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const stats = {
      totalAppointments,
      appointmentsToday,
      appointmentsThisMonth,
      appointmentsByStatus: appointmentsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };

    sendSuccess(res, 'Receptionist statistics retrieved successfully', { stats });
  } catch (error) {
    console.error('Error getting receptionist statistics:', error);
    sendError(res, 'Failed to retrieve receptionist statistics', error.message);
  }
};

// Get receptionist dashboard data
const getReceptionistDashboard = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if receptionist exists
    const receptionist = await User.findOne({ _id: id, role: 'receptionist' });
    if (!receptionist) {
      return sendNotFound(res, 'Receptionist not found');
    }

    // Get dashboard data
    const totalPatients = await Patient.countDocuments();
    const totalAppointments = await Appointment.countDocuments({ scheduledBy: id });
    const appointmentsToday = await Appointment.countDocuments({
      scheduledBy: id,
      appointmentDate: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lt: new Date().setHours(23, 59, 59, 999)
      }
    });

    // Get recent appointments
    const recentAppointments = await Appointment.find({ scheduledBy: id })
      .populate('patient', 'firstName lastName phone')
      .populate('doctor', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get upcoming appointments
    const upcomingAppointments = await Appointment.find({
      scheduledBy: id,
      appointmentDate: { $gte: new Date() },
      status: { $in: ['scheduled', 'checked-in'] }
    })
      .populate('patient', 'firstName lastName phone')
      .populate('doctor', 'firstName lastName')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .limit(5);

    const dashboard = {
      totalPatients,
      totalAppointments,
      appointmentsToday,
      recentAppointments,
      upcomingAppointments
    };

    sendSuccess(res, 'Receptionist dashboard data retrieved successfully', { dashboard });
  } catch (error) {
    console.error('Error getting receptionist dashboard:', error);
    sendError(res, 'Failed to retrieve receptionist dashboard data', error.message);
  }
};

module.exports = {
  getReceptionists,
  getReceptionist,
  updateReceptionist,
  deleteReceptionist,
  getReceptionistStats,
  getReceptionistDashboard
};
