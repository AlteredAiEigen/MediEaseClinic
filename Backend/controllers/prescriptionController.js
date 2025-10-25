const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const { validationResult } = require('express-validator');
const path = require('path');
const { deleteFile } = require('../utils/imageUpload');

// @desc    Create prescription
// @route   POST /api/prescriptions
// @access  Private (Doctor)
const createPrescription = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { patientId, appointmentId, queueId, medications, diagnosis, notes } = req.body;

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const prescription = await Prescription.create({
      patient: patientId,
      doctor: req.user.id,
      appointment: appointmentId || null,
      queue: queueId || null,
      medications: medications || [],
      diagnosis: diagnosis || '',
      notes: notes || ''
    });

    await prescription.populate([
      { path: 'patient', select: 'firstName lastName patientId phone' },
      { path: 'doctor', select: 'firstName lastName speciality' },
      { path: 'appointment' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: prescription
    });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create prescription',
      error: error.message
    });
  }
};

// @desc    Get all prescriptions
// @route   GET /api/prescriptions
// @access  Private (Doctor, Admin)
const getPrescriptions = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination;
    const patientId = req.query.patientId;
    const doctorId = req.query.doctorId;

    let query = { isActive: true };

    if (patientId) {
      query.patient = patientId;
    }

    if (doctorId) {
      query.doctor = doctorId;
    }

    const prescriptions = await Prescription.find(query)
      .populate('patient', 'firstName lastName patientId phone')
      .populate('doctor', 'firstName lastName speciality')
      .populate('appointment', 'date time')
      .sort({ prescribedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Prescription.countDocuments(query);

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      total,
      data: prescriptions
    });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescriptions',
      error: error.message
    });
  }
};

// @desc    Get single prescription
// @route   GET /api/prescriptions/:id
// @access  Private (Doctor, Receptionist, Admin)
const getPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'firstName lastName patientId phone email address')
      .populate('doctor', 'firstName lastName speciality licenseNumber')
      .populate('appointment', 'date time reason');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    res.status(200).json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescription',
      error: error.message
    });
  }
};

// @desc    Get prescriptions by patient
// @route   GET /api/prescriptions/patient/:patientId
// @access  Private (Doctor, Receptionist, Admin)
const getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;
    const activeOnly = req.query.activeOnly === 'true';

    const prescriptions = await Prescription.getPatientPrescriptions(patientId, { activeOnly });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: {
        prescriptions
      }
    });
  } catch (error) {
    console.error('Get patient prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient prescriptions',
      error: error.message
    });
  }
};

// @desc    Get prescriptions by doctor
// @route   GET /api/prescriptions/doctor/:doctorId
// @access  Private (Doctor, Admin)
const getDoctorPrescriptions = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;

    const prescriptions = await Prescription.getDoctorPrescriptions(doctorId, {
      startDate,
      endDate
    });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: {
        prescriptions
      }
    });
  } catch (error) {
    console.error('Get doctor prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor prescriptions',
      error: error.message
    });
  }
};

// @desc    Update prescription
// @route   PUT /api/prescriptions/:id
// @access  Private (Doctor)
const updatePrescription = async (req, res) => {
  try {
    const { medications, diagnosis, notes } = req.body;

    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Only the prescribing doctor can update
    if (prescription.doctor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this prescription'
      });
    }

    if (medications) prescription.medications = medications;
    if (diagnosis !== undefined) prescription.diagnosis = diagnosis;
    if (notes !== undefined) prescription.notes = notes;

    await prescription.save();

    await prescription.populate([
      { path: 'patient', select: 'firstName lastName patientId phone' },
      { path: 'doctor', select: 'firstName lastName speciality' },
      { path: 'appointment' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Prescription updated successfully',
      data: prescription
    });
  } catch (error) {
    console.error('Update prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update prescription',
      error: error.message
    });
  }
};

// @desc    Upload prescription image
// @route   POST /api/prescriptions/:id/upload-image
// @access  Private (Receptionist, Doctor, Admin)
const uploadPrescriptionImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      // Delete uploaded file if prescription not found
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Delete old image if exists
    if (prescription.imageUrl) {
      const oldImagePath = path.join(__dirname, '../uploads/prescriptions', path.basename(prescription.imageUrl));
      deleteFile(oldImagePath);
    }

    // Save new image path
    prescription.imageUrl = `/uploads/prescriptions/${req.file.filename}`;
    await prescription.save();

    res.status(200).json({
      success: true,
      message: 'Prescription image uploaded successfully',
      data: {
        imageUrl: prescription.imageUrl
      }
    });
  } catch (error) {
    // Delete uploaded file on error
    if (req.file) {
      deleteFile(req.file.path);
    }
    console.error('Upload prescription image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload prescription image',
      error: error.message
    });
  }
};

// @desc    Delete prescription
// @route   DELETE /api/prescriptions/:id
// @access  Private (Doctor, Admin)
const deletePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Only the prescribing doctor or admin can delete
    if (prescription.doctor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this prescription'
      });
    }

    // Soft delete
    prescription.isActive = false;
    await prescription.save();

    res.status(200).json({
      success: true,
      message: 'Prescription deleted successfully'
    });
  } catch (error) {
    console.error('Delete prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete prescription',
      error: error.message
    });
  }
};

module.exports = {
  createPrescription,
  getPrescriptions,
  getPrescription,
  getPatientPrescriptions,
  getDoctorPrescriptions,
  updatePrescription,
  uploadPrescriptionImage,
  deletePrescription
};

