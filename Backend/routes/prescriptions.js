const express = require('express');
const { body, param } = require('express-validator');
const {
  createPrescription,
  getPrescriptions,
  getPrescription,
  getPatientPrescriptions,
  getDoctorPrescriptions,
  updatePrescription,
  uploadPrescriptionImage,
  deletePrescription
} = require('../controllers/prescriptionController');
const { protect, authorize } = require('../middleware/auth');
const { pagination, addPaginationMeta } = require('../middleware/pagination');
const { upload } = require('../utils/imageUpload');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Medication:
 *       type: object
 *       required:
 *         - name
 *         - dosage
 *         - frequency
 *         - duration
 *       properties:
 *         name:
 *           type: string
 *           description: Medication name
 *         dosage:
 *           type: string
 *           description: Dosage amount
 *         frequency:
 *           type: string
 *           description: Frequency of administration
 *         duration:
 *           type: string
 *           description: Duration of treatment
 *         instructions:
 *           type: string
 *           description: Special instructions
 *
 *     Prescription:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         prescriptionId:
 *           type: string
 *           description: Auto-generated prescription ID
 *         patient:
 *           type: string
 *           description: Patient ID reference
 *         doctor:
 *           type: string
 *           description: Doctor ID reference
 *         appointment:
 *           type: string
 *           description: Appointment ID reference
 *         medications:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Medication'
 *         diagnosis:
 *           type: string
 *         notes:
 *           type: string
 *         imageUrl:
 *           type: string
 *           description: URL to prescription image
 *         validUntil:
 *           type: string
 *           format: date-time
 *         prescribedAt:
 *           type: string
 *           format: date-time
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /api/prescriptions:
 *   get:
 *     summary: Get all prescriptions
 *     description: Get prescriptions with optional filtering by patient or doctor
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prescriptions retrieved successfully
 *   post:
 *     summary: Create prescription
 *     description: Create a new prescription (doctor only)
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - medications
 *             properties:
 *               patientId:
 *                 type: string
 *               appointmentId:
 *                 type: string
 *               queueId:
 *                 type: string
 *               medications:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Medication'
 *               diagnosis:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Prescription created successfully
 */
router.route('/')
  .get(protect, authorize('doctor', 'admin'), pagination, addPaginationMeta, getPrescriptions)
  .post(protect, authorize('doctor'), [
    body('patientId')
      .notEmpty()
      .withMessage('Patient ID is required')
      .isMongoId()
      .withMessage('Invalid patient ID'),
    body('appointmentId')
      .optional()
      .isMongoId()
      .withMessage('Invalid appointment ID'),
    body('queueId')
      .optional()
      .isMongoId()
      .withMessage('Invalid queue ID'),
    body('medications')
      .isArray({ min: 1 })
      .withMessage('At least one medication is required'),
    body('medications.*.name')
      .notEmpty()
      .withMessage('Medication name is required'),
    body('medications.*.dosage')
      .notEmpty()
      .withMessage('Medication dosage is required'),
    body('medications.*.frequency')
      .notEmpty()
      .withMessage('Medication frequency is required'),
    body('medications.*.duration')
      .notEmpty()
      .withMessage('Medication duration is required')
  ], createPrescription);

/**
 * @swagger
 * /api/prescriptions/patient/{patientId}:
 *   get:
 *     summary: Get patient prescriptions
 *     description: Get all prescriptions for a specific patient
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Patient prescriptions retrieved successfully
 */
router.get('/patient/:patientId', protect, [
  param('patientId')
    .isMongoId()
    .withMessage('Invalid patient ID')
], getPatientPrescriptions);

/**
 * @swagger
 * /api/prescriptions/doctor/{doctorId}:
 *   get:
 *     summary: Get doctor prescriptions
 *     description: Get all prescriptions by a specific doctor
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Doctor prescriptions retrieved successfully
 */
router.get('/doctor/:doctorId', protect, authorize('doctor', 'admin'), [
  param('doctorId')
    .isMongoId()
    .withMessage('Invalid doctor ID')
], getDoctorPrescriptions);

/**
 * @swagger
 * /api/prescriptions/{id}:
 *   get:
 *     summary: Get single prescription
 *     description: Get details of a specific prescription
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prescription retrieved successfully
 *       404:
 *         description: Prescription not found
 *   put:
 *     summary: Update prescription
 *     description: Update prescription details (doctor only)
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               medications:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Medication'
 *               diagnosis:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Prescription updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Prescription not found
 *   delete:
 *     summary: Delete prescription
 *     description: Delete a prescription (doctor or admin only)
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prescription deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Prescription not found
 */
router.route('/:id')
  .get(protect, [
    param('id')
      .isMongoId()
      .withMessage('Invalid prescription ID')
  ], getPrescription)
  .put(protect, authorize('doctor'), [
    param('id')
      .isMongoId()
      .withMessage('Invalid prescription ID')
  ], updatePrescription)
  .delete(protect, authorize('doctor', 'admin'), [
    param('id')
      .isMongoId()
      .withMessage('Invalid prescription ID')
  ], deletePrescription);

/**
 * @swagger
 * /api/prescriptions/{id}/upload-image:
 *   post:
 *     summary: Upload prescription image
 *     description: Upload a scanned/photo of prescription
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: No file uploaded or invalid file
 *       404:
 *         description: Prescription not found
 */
router.post('/:id/upload-image', protect, authorize('receptionist', 'doctor', 'admin'), upload.single('image'), uploadPrescriptionImage);

module.exports = router;

