const express = require('express');
const { body, param } = require('express-validator');
const {
  checkInPatient,
  getQueue,
  getDoctorQueue,
  getQueueEntry,
  updateQueueStatus,
  startConsultation,
  checkOutPatient,
  getQueueStats
} = require('../controllers/queueController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     QueueEntry:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         queueId:
 *           type: string
 *           description: Auto-generated queue ID
 *         patient:
 *           type: string
 *           description: Patient ID reference
 *         appointment:
 *           type: string
 *           description: Appointment ID reference (optional)
 *         doctor:
 *           type: string
 *           description: Doctor ID reference
 *         checkedInAt:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [waiting, in-consultation, completed, checked-out, cancelled]
 *         queueNumber:
 *           type: integer
 *         priority:
 *           type: string
 *           enum: [low, medium, high, emergency]
 *         reason:
 *           type: string
 *         notes:
 *           type: string
 *         waitTime:
 *           type: integer
 *           description: Wait time in minutes
 */

/**
 * @swagger
 * /api/queue/check-in:
 *   post:
 *     summary: Check in a patient
 *     description: Add a patient to the clinic queue
 *     tags: [Queue]
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
 *               - doctorId
 *             properties:
 *               patientId:
 *                 type: string
 *                 description: Patient ID
 *               doctorId:
 *                 type: string
 *                 description: Doctor ID
 *               appointmentId:
 *                 type: string
 *                 description: Optional appointment ID
 *               reason:
 *                 type: string
 *                 description: Reason for visit
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, emergency]
 *                 description: Priority level
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *     responses:
 *       201:
 *         description: Patient checked in successfully
 *       400:
 *         description: Validation error or patient already in queue
 *       404:
 *         description: Patient not found
 */
router.post('/check-in', protect, authorize('receptionist', 'admin'), [
  body('patientId')
    .notEmpty()
    .withMessage('Patient ID is required')
    .isMongoId()
    .withMessage('Invalid patient ID'),
  body('doctorId')
    .notEmpty()
    .withMessage('Doctor ID is required')
    .isMongoId()
    .withMessage('Invalid doctor ID'),
  body('appointmentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid appointment ID'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'emergency'])
    .withMessage('Invalid priority level')
], checkInPatient);

/**
 * @swagger
 * /api/queue:
 *   get:
 *     summary: Get current queue
 *     description: Get all active patients in the clinic queue
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Queue retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: object
 *                   properties:
 *                     queue:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/QueueEntry'
 */
router.get('/', protect, getQueue);

/**
 * @swagger
 * /api/queue/stats:
 *   get:
 *     summary: Get queue statistics
 *     description: Get statistics about today's queue
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats', protect, authorize('admin', 'doctor'), getQueueStats);

/**
 * @swagger
 * /api/queue/doctor/{doctorId}:
 *   get:
 *     summary: Get doctor's queue
 *     description: Get today's queue for a specific doctor
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor's queue retrieved successfully
 */
router.get('/doctor/:doctorId', protect, [
  param('doctorId')
    .isMongoId()
    .withMessage('Invalid doctor ID')
], getDoctorQueue);

/**
 * @swagger
 * /api/queue/{id}:
 *   get:
 *     summary: Get single queue entry
 *     description: Get details of a specific queue entry
 *     tags: [Queue]
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
 *         description: Queue entry retrieved successfully
 *       404:
 *         description: Queue entry not found
 */
router.get('/:id', protect, [
  param('id')
    .isMongoId()
    .withMessage('Invalid queue ID')
], getQueueEntry);

/**
 * @swagger
 * /api/queue/{id}/status:
 *   put:
 *     summary: Update queue status
 *     description: Update the status of a queue entry
 *     tags: [Queue]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [waiting, in-consultation, completed, checked-out, cancelled]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       404:
 *         description: Queue entry not found
 */
router.put('/:id/status', protect, [
  param('id')
    .isMongoId()
    .withMessage('Invalid queue ID'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['waiting', 'in-consultation', 'completed', 'checked-out', 'cancelled'])
    .withMessage('Invalid status')
], updateQueueStatus);

/**
 * @swagger
 * /api/queue/{id}/start-consultation:
 *   put:
 *     summary: Start consultation
 *     description: Mark a queue entry as in-consultation
 *     tags: [Queue]
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
 *         description: Consultation started successfully
 *       404:
 *         description: Queue entry not found
 */
router.put('/:id/start-consultation', protect, authorize('doctor'), [
  param('id')
    .isMongoId()
    .withMessage('Invalid queue ID')
], startConsultation);

/**
 * @swagger
 * /api/queue/{id}/check-out:
 *   post:
 *     summary: Check out patient
 *     description: Mark a patient as checked out and remove from active queue
 *     tags: [Queue]
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
 *         description: Patient checked out successfully
 *       404:
 *         description: Queue entry not found
 */
router.post('/:id/check-out', protect, authorize('receptionist', 'admin'), [
  param('id')
    .isMongoId()
    .withMessage('Invalid queue ID')
], checkOutPatient);

module.exports = router;

