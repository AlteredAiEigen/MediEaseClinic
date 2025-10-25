const Patient = require('../models/Patient');
const { validationResult } = require('express-validator');

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private (Doctor, Receptionist, Admin)
const getPatients = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'updatedAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    let query = { isActive: true };

    // Add search functionality
    if (search) {
      query = {
        ...query,
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { patientId: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const patients = await Patient.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await Patient.countDocuments(query);

    res.status(200).json({
      success: true,
      count: patients.length,
      total,
      data: patients
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients',
      error: error.message
    });
  }
};

// @desc    Get single patient
// @route   GET /api/patients/:id
// @access  Private (Doctor, Receptionist, Admin)
const getPatient = async (req, res) => {
  try {
    // Check if ID is valid MongoDB ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient',
      error: error.message
    });
  }
};

// @desc    Get patient full profile with appointment history
// @route   GET /api/patients/:id/full-profile
// @access  Private (Doctor, Admin)
const getPatientFullProfile = async (req, res) => {
  try {
    // Check if ID is valid MongoDB ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    const patient = await Patient.findById(req.params.id)
      .populate({
        path: 'appointmentHistory',
        populate: [
          { path: 'doctor', select: 'firstName lastName speciality' },
          { path: 'scheduledBy', select: 'firstName lastName' }
        ]
      });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Get patient full profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient profile',
      error: error.message
    });
  }
};

// @desc    Get patient appointments
// @route   GET /api/patients/:id/appointments
// @access  Private (Doctor, Receptionist, Admin)
const getPatientAppointments = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate({
        path: 'appointmentHistory',
        populate: [
          { path: 'doctor', select: 'firstName lastName speciality' },
          { path: 'scheduledBy', select: 'firstName lastName' }
        ]
      });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      count: patient.appointmentHistory ? patient.appointmentHistory.length : 0,
      data: {
        appointments: patient.appointmentHistory || []
      }
    });
  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient appointments',
      error: error.message
    });
  }
};

// @desc    Get patient by patient ID
// @route   GET /api/patients/patient-id/:patientId
// @access  Private (Doctor, Receptionist, Admin)
const getPatientByPatientId = async (req, res) => {
  try {
    const patient = await Patient.findByPatientId(req.params.patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Get patient by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient',
      error: error.message
    });
  }
};

// @desc    Create new patient
// @route   POST /api/patients
// @access  Private (Receptionist, Admin)
const createPatient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check for duplicate email or phone
    const existingPatient = await Patient.findOne({
      $or: [
        { email: req.body.email },
        { phone: req.body.phone }
      ]
    });

    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: 'Patient with this email or phone number already exists'
      });
    }

    const patient = await Patient.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: patient
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create patient',
      error: error.message
    });
  }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private (Doctor, Receptionist, Admin)
const updatePatient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check for duplicate email or phone (excluding current patient)
    const existingPatient = await Patient.findOne({
      _id: { $ne: req.params.id },
      $or: [
        { email: req.body.email },
        { phone: req.body.phone }
      ]
    });

    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: 'Another patient with this email or phone number already exists'
      });
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      data: patient
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update patient',
      error: error.message
    });
  }
};

// @desc    Delete patient (soft delete)
// @route   DELETE /api/patients/:id
// @access  Private (Admin)
const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete patient',
      error: error.message
    });
  }
};

// @desc    Search patients
// @route   GET /api/patients/search
// @access  Private (Doctor, Receptionist, Admin)
const searchPatients = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const patients = await Patient.searchPatients(q);

    res.status(200).json({
      success: true,
      count: patients.length,
      data: {
        patients,
        pagination: {
          current: 1,
          pages: 1,
          total: patients.length,
          limit: patients.length
        }
      }
    });
  } catch (error) {
    console.error('Search patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search patients',
      error: error.message
    });
  }
};

// @desc    Update patient vitals
// @route   PUT /api/patients/:id/vitals
// @access  Private (Doctor, Receptionist, Admin)
const updatePatientVitals = async (req, res) => {
  try {
    const { bloodPressure, heartRate, temperature, oxygenSaturation, weight, height, bmi } = req.body;

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { 
        vitals: {
          bloodPressure,
          heartRate,
          temperature,
          oxygenSaturation,
          weight,
          height,
          bmi
        }
      },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient vitals updated successfully',
      data: patient
    });
  } catch (error) {
    console.error('Update patient vitals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update patient vitals',
      error: error.message
    });
  }
};

// @desc    Update patient medical history
// @route   PUT /api/patients/:id/medical-history
// @access  Private (Doctor, Admin)
const updatePatientMedicalHistory = async (req, res) => {
  try {
    const { 
      medicalHistory, 
      allergies, 
      familyHistory, 
      previousSurgeries, 
      currentMedication,
      medicationDosage,
      medicationFrequency,
      lastMedicationReview
    } = req.body;

    const updateData = {};
    if (medicalHistory !== undefined) updateData.medicalHistory = medicalHistory;
    if (allergies !== undefined) updateData.allergies = allergies;
    if (familyHistory !== undefined) updateData.familyHistory = familyHistory;
    if (previousSurgeries !== undefined) updateData.previousSurgeries = previousSurgeries;
    if (currentMedication !== undefined) updateData.currentMedication = currentMedication;
    if (medicationDosage !== undefined) updateData.medicationDosage = medicationDosage;
    if (medicationFrequency !== undefined) updateData.medicationFrequency = medicationFrequency;
    if (lastMedicationReview !== undefined) updateData.lastMedicationReview = lastMedicationReview;

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient medical history updated successfully',
      data: patient
    });
  } catch (error) {
    console.error('Update patient medical history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update patient medical history',
      error: error.message
    });
  }
};

// @desc    Quick patient registration (for walk-ins)
// @route   POST /api/patients/quick-register
// @access  Private (Receptionist, Admin)
const quickRegisterPatient = async (req, res) => {
  try {
    const { firstName, lastName, phone, age, gender, bloodGroup } = req.body;

    if (!firstName || !lastName || !phone || !age || !gender || !bloodGroup) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: firstName, lastName, phone, age, gender, bloodGroup'
      });
    }

    // Check if patient with phone exists
    const existingPatient = await Patient.findOne({ phone });
    if (existingPatient) {
      return res.status(200).json({
        success: true,
        message: 'Patient already exists',
        data: existingPatient,
        existing: true
      });
    }

    // Create temporary email from phone (remove + and any special chars)
    const cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
    const tempEmail = `patient${cleanPhone}@temp.mediease.com`;

    // Create minimal patient record
    const patient = await Patient.create({
      firstName,
      lastName,
      phone,
      age,
      gender,
      bloodGroup,
      email: tempEmail,
      address: 'To be updated',
      dateOfBirth: 'To be updated'
    });

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: patient,
      existing: false
    });
  } catch (error) {
    console.error('Quick register patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register patient',
      error: error.message
    });
  }
};

// @desc    Get patient statistics
// @route   GET /api/patients/stats
// @access  Private (Admin, Doctor)
const getPatientStats = async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments({ isActive: true });
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const newPatientsThisMonth = await Patient.countDocuments({
      isActive: true,
      createdAt: { $gte: thisMonth }
    });

    const patientsByGender = await Patient.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);

    const patientsByAgeGroup = await Patient.aggregate([
      { $match: { isActive: true } },
      {
        $addFields: {
          ageNum: { $toInt: '$age' }
        }
      },
      {
        $bucket: {
          groupBy: '$ageNum',
          boundaries: [0, 18, 30, 45, 60, 100],
          default: 'Unknown',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPatients,
        newPatientsThisMonth,
        patientsByGender,
        patientsByAgeGroup
      }
    });
  } catch (error) {
    console.error('Get patient stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient statistics',
      error: error.message
    });
  }
};

module.exports = {
  getPatients,
  getPatient,
  getPatientFullProfile,
  getPatientAppointments,
  getPatientByPatientId,
  createPatient,
  updatePatient,
  updatePatientVitals,
  updatePatientMedicalHistory,
  quickRegisterPatient,
  deletePatient,
  searchPatients,
  getPatientStats
};
