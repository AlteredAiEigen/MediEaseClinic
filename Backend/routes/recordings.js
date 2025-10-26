const express = require('express');
const {
  getRecordings,
  getRecording,
  createRecording,
  updateRecording,
  deleteRecording,
  getRecordingsByPatient,
  getRecordingsByDoctor,
  processRecording
} = require('../controllers/recordingController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Recording:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier
 *         recordingId:
 *           type: string
 *           description: Auto-generated recording ID
 *         patientId:
 *           type: string
 *           description: Patient ID
 *         appointmentId:
 *           type: string
 *           description: Appointment ID
 *         doctorId:
 *           type: string
 *           description: Doctor ID
 *         filename:
 *           type: string
 *           description: Original filename
 *         originalName:
 *           type: string
 *           description: Original file name
 *         fileSize:
 *           type: integer
 *           description: File size in bytes
 *         mimeType:
 *           type: string
 *           description: MIME type of the file
 *         duration:
 *           type: number
 *           description: Recording duration in seconds
 *         transcription:
 *           type: string
 *           description: AI-generated transcription
 *         summary:
 *           type: string
 *           description: AI-generated summary
 *         status:
 *           type: string
 *           enum: [processing, completed, failed]
 *           description: Processing status
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags for categorization
 *         notes:
 *           type: string
 *           description: Additional notes
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     RecordingCreateRequest:
 *       type: object
 *       required:
 *         - patientId
 *         - appointmentId
 *         - doctorId
 *         - filename
 *         - fileSize
 *         - mimeType
 *       properties:
 *         patientId:
 *           type: string
 *           description: Patient ID
 *         appointmentId:
 *           type: string
 *           description: Appointment ID
 *         doctorId:
 *           type: string
 *           description: Doctor ID
 *         filename:
 *           type: string
 *           description: Recording filename
 *         fileSize:
 *           type: integer
 *           minimum: 0
 *           description: File size in bytes
 *         mimeType:
 *           type: string
 *           description: MIME type
 *         duration:
 *           type: number
 *           minimum: 0
 *           description: Duration in seconds
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Initial tags
 *         notes:
 *           type: string
 *           description: Initial notes
 *
 *     RecordingUpdateRequest:
 *       type: object
 *       properties:
 *         transcription:
 *           type: string
 *           description: Updated transcription
 *         summary:
 *           type: string
 *           description: Updated summary
 *         status:
 *           type: string
 *           enum: [processing, completed, failed]
 *           description: Updated status
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Updated tags
 *         notes:
 *           type: string
 *           description: Updated notes
 */

const router = express.Router();

/**
 * @swagger
 * /api/recordings:
 *   get:
 *     summary: Get all recordings
 *     description: Retrieve a list of all recordings with optional filtering and pagination
 *     tags: [Recordings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *         description: Filter by patient ID
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *         description: Filter by doctor ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [processing, completed, failed]
 *         description: Filter by processing status
 *     responses:
 *       200:
 *         description: Recordings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     recordings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Recording'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (doctor or admin only)
 *       500:
 *         description: Server error
 */
router.get('/', protect, authorize('doctor', 'admin'), getRecordings);

/**
 * @swagger
 * /api/recordings/patient/{patientId}:
 *   get:
 *     summary: Get recordings by patient
 *     description: Retrieve all recordings for a specific patient
 *     tags: [Recordings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Recordings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     recordings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Recording'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (doctor or admin only)
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */
router.get('/patient/:patientId', protect, authorize('doctor', 'admin'), getRecordingsByPatient);

/**
 * @swagger
 * /api/recordings/doctor/{doctorId}:
 *   get:
 *     summary: Get recordings by doctor
 *     description: Retrieve all recordings for a specific doctor
 *     tags: [Recordings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Recordings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     recordings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Recording'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (doctor or admin only)
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Server error
 */
router.get('/doctor/:doctorId', protect, authorize('doctor', 'admin'), getRecordingsByDoctor);

/**
 * @swagger
 * /api/recordings/{id}:
 *   get:
 *     summary: Get single recording
 *     description: Retrieve detailed information about a specific recording
 *     tags: [Recordings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recording ID
 *     responses:
 *       200:
 *         description: Recording retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     recording:
 *                       $ref: '#/components/schemas/Recording'
 *       404:
 *         description: Recording not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (doctor or admin only)
 *       500:
 *         description: Server error
 */
router.get('/:id', protect, authorize('doctor', 'admin'), getRecording);

/**
 * @swagger
 * /api/recordings:
 *   post:
 *     summary: Create new recording
 *     description: Create a new recording entry (typically after file upload)
 *     tags: [Recordings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecordingCreateRequest'
 *           example:
 *             patientId: "60f1b2b3c4d5e6f7g8h9i0j1"
 *             appointmentId: "60f1b2b3c4d5e6f7g8h9i0j2"
 *             doctorId: "60f1b2b3c4d5e6f7g8h9i0j3"
 *             filename: "consultation_2024-01-15.mp3"
 *             fileSize: 5242880
 *             mimeType: "audio/mpeg"
 *             duration: 1800
 *             tags: ["consultation", "follow-up"]
 *             notes: "Patient consultation recording"
 *     responses:
 *       201:
 *         description: Recording created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     recording:
 *                       $ref: '#/components/schemas/Recording'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (doctor only)
 *       500:
 *         description: Server error
 */
router.post('/', protect, authorize('doctor'), createRecording);

/**
 * @swagger
 * /api/recordings/{id}:
 *   put:
 *     summary: Update recording
 *     description: Update recording information and metadata
 *     tags: [Recordings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recording ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecordingUpdateRequest'
 *           example:
 *             transcription: "Patient reports chest pain..."
 *             summary: "Patient experiencing chest discomfort, prescribed medication"
 *             status: "completed"
 *             tags: ["chest pain", "cardiology", "medication"]
 *             notes: "Follow up in 2 weeks"
 *     responses:
 *       200:
 *         description: Recording updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     recording:
 *                       $ref: '#/components/schemas/Recording'
 *       404:
 *         description: Recording not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (doctor only)
 *       500:
 *         description: Server error
 */
router.put('/:id', protect, authorize('doctor'), updateRecording);

/**
 * @swagger
 * /api/recordings/{id}/process:
 *   post:
 *     summary: Process recording
 *     description: Trigger AI processing for transcription and summarization
 *     tags: [Recordings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recording ID
 *     responses:
 *       200:
 *         description: Processing started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Recording processing started"
 *                 data:
 *                   type: object
 *                   properties:
 *                     recording:
 *                       $ref: '#/components/schemas/Recording'
 *       404:
 *         description: Recording not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (doctor only)
 *       500:
 *         description: Server error
 */
router.post('/:id/process', protect, authorize('doctor'), processRecording);

/**
 * @swagger
 * /api/recordings/{id}:
 *   delete:
 *     summary: Delete recording
 *     description: Delete a recording and its associated file
 *     tags: [Recordings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recording ID
 *     responses:
 *       200:
 *         description: Recording deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Recording deleted successfully"
 *       404:
 *         description: Recording not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (doctor or admin only)
 *       500:
 *         description: Server error
 */
router.delete('/:id', protect, authorize('doctor', 'admin'), deleteRecording);

module.exports = router;
