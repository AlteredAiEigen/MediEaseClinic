const express = require('express');
const {
  getClinicalNotes,
  getClinicalNote,
  createClinicalNote,
  updateClinicalNote,
  deleteClinicalNote,
  generateNotesFromConsultation,
  getActionableNotes,
  markNoteComplete,
  generateNoteFromTranscript,
  generateAITreatmentPlan,
  generateAIPrescription,
  summarizeAIConsultation
} = require('../controllers/clinicalNotesController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     ClinicalNote:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier
 *         noteId:
 *           type: string
 *           description: Auto-generated note ID (e.g., NOTE00123456)
 *         patient:
 *           type: string
 *           description: Patient ID
 *         doctor:
 *           type: string
 *           description: Doctor ID
 *         appointment:
 *           type: string
 *           description: Associated appointment ID
 *         type:
 *           type: string
 *           enum: [consultation, diagnosis, treatment, follow-up, emergency]
 *           description: Type of clinical note
 *         title:
 *           type: string
 *           maxLength: 200
 *           description: Note title
 *         content:
 *           type: string
 *           maxLength: 5000
 *           description: Detailed clinical note content
 *         category:
 *           type: string
 *           enum: [consultation, diagnosis, treatment, follow-up, emergency]
 *           description: Clinical category
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           description: Clinical priority
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Associated tags/keywords
 *         actionable:
 *           type: boolean
 *           description: Whether this note requires action
 *         actionItems:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               item:
 *                 type: string
 *                 description: Action item description
 *               completed:
 *                 type: boolean
 *                 description: Whether action item is completed
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: Due date for action item
 *         completed:
 *           type: boolean
 *           description: Whether the note/follow-up is completed
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: Completion timestamp
 *         followUpRequired:
 *           type: boolean
 *           description: Whether follow-up is required
 *         followUpDate:
 *           type: string
 *           format: date
 *           description: Follow-up date
 *         patientName:
 *           type: string
 *           description: Patient's full name (populated field)
 *         doctorName:
 *           type: string
 *           description: Doctor's full name (populated field)
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     ClinicalNoteCreateRequest:
 *       type: object
 *       required:
 *         - patient
 *         - doctor
 *         - title
 *         - content
 *         - category
 *         - priority
 *       properties:
 *         patient:
 *           type: string
 *           description: Patient ID
 *         doctor:
 *           type: string
 *           description: Doctor ID
 *         appointment:
 *           type: string
 *           description: Associated appointment ID
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *           description: Note title
 *         content:
 *           type: string
 *           minLength: 1
 *           maxLength: 5000
 *           description: Detailed clinical note content
 *         category:
 *           type: string
 *           enum: [consultation, diagnosis, treatment, follow-up, emergency]
 *           description: Clinical category
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           description: Clinical priority
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Associated tags/keywords
 *         actionable:
 *           type: boolean
 *           default: false
 *           description: Whether this note requires action
 *         actionItems:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               item:
 *                 type: string
 *                 description: Action item description
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: Due date for action item
 *
 *     ClinicalNoteGenerateRequest:
 *       type: object
 *       required:
 *         - patientId
 *         - appointmentId
 *       properties:
 *         patientId:
 *           type: string
 *           description: Patient ID
 *         appointmentId:
 *           type: string
 *           description: Appointment ID
 *         duration:
 *           type: integer
 *           minimum: 1
 *           maximum: 480
 *           default: 30
 *           description: Consultation duration in minutes
 *         notes:
 *           type: string
 *           maxLength: 2000
 *           description: Additional consultation notes
 */

const router = express.Router();

/**
 * @swagger
 * /api/clinical-notes:
 *   get:
 *     summary: Get all clinical notes
 *     description: Retrieve a paginated list of clinical notes with optional filtering
 *     tags: [Clinical Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of notes per page
 *       - in: query
 *         name: patient
 *         schema:
 *           type: string
 *         description: Filter by patient ID
 *       - in: query
 *         name: doctor
 *         schema:
 *           type: string
 *         description: Filter by doctor ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [consultation, diagnosis, treatment, follow-up, emergency]
 *         description: Filter by category
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: actionable
 *         schema:
 *           type: boolean
 *         description: Filter by actionable status
 *     responses:
 *       200:
 *         description: Clinical notes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   description: Number of notes in current page
 *                 total:
 *                   type: integer
 *                   description: Total number of notes
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ClinicalNote'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (requires doctor or admin role)
 *       500:
 *         description: Server error
 */
router.get('/', protect, authorize('doctor', 'admin'), getClinicalNotes);

// @route   GET /api/clinical-notes/actionable
// @desc    Get actionable notes
// @access  Private (Doctor, Admin)
router.get('/actionable', protect, authorize('doctor', 'admin'), getActionableNotes);

// @route   POST /api/clinical-notes/generate
// @desc    Generate notes from consultation
// @access  Private (Doctor)
router.post('/generate', protect, authorize('doctor'), generateNotesFromConsultation);

// @route   GET /api/clinical-notes/:id
// @desc    Get single clinical note
// @access  Private (Doctor, Admin)
router.get('/:id', protect, authorize('doctor', 'admin'), getClinicalNote);

/**
 * @swagger
 * /api/clinical-notes:
 *   post:
 *     summary: Create a new clinical note
 *     description: Create a new clinical note for a patient
 *     tags: [Clinical Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClinicalNoteCreateRequest'
 *           example:
 *             patient: "60d5ecb74b24c72b8c8b4567"
 *             doctor: "60d5ecb74b24c72b8c8b4568"
 *             appointment: "60d5ecb74b24c72b8c8b4569"
 *             title: "Initial Consultation"
 *             content: "Patient presented with symptoms of hypertension. Blood pressure readings: 150/90 mmHg. Recommended lifestyle modifications and follow-up in 2 weeks."
 *             category: "consultation"
 *             priority: "high"
 *             tags: ["hypertension", "follow-up"]
 *             actionable: true
 *             actionItems:
 *               - item: "Schedule follow-up appointment"
 *                 dueDate: "2024-01-15"
 *     responses:
 *       201:
 *         description: Clinical note created successfully
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
 *                   example: "Clinical note created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ClinicalNote'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (requires doctor role)
 *       500:
 *         description: Server error
 */
router.post('/', protect, authorize('doctor'), createClinicalNote);

// @route   PUT /api/clinical-notes/:id
// @desc    Update clinical note
// @access  Private (Doctor)
router.put('/:id', protect, authorize('doctor'), updateClinicalNote);

// @route   PUT /api/clinical-notes/:id/complete
// @desc    Mark note as complete
// @access  Private (Doctor)
router.put('/:id/complete', protect, authorize('doctor'), markNoteComplete);

// @route   DELETE /api/clinical-notes/:id
// @desc    Delete clinical note
// @access  Private (Doctor, Admin)
router.delete('/:id', protect, authorize('doctor', 'admin'), deleteClinicalNote);

/**
 * @swagger
 * /api/clinical-notes/ai/generate-from-transcript:
 *   post:
 *     summary: Generate clinical note from transcript using AI
 *     description: Use AI to extract structured clinical data from consultation transcript
 *     tags: [Clinical Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transcript
 *               - patientId
 *             properties:
 *               transcript:
 *                 type: string
 *                 description: Consultation transcript text
 *               patientId:
 *                 type: string
 *                 description: Patient ID
 *               appointmentId:
 *                 type: string
 *                 description: Optional appointment ID
 *               useGemini:
 *                 type: boolean
 *                 description: Use Gemini AI instead of OpenAI
 *     responses:
 *       201:
 *         description: Clinical note generated successfully
 *       400:
 *         description: Validation error
 */
router.post('/ai/generate-from-transcript', protect, authorize('doctor'), generateNoteFromTranscript);

/**
 * @swagger
 * /api/clinical-notes/ai/treatment-plan:
 *   post:
 *     summary: Generate treatment plan using AI
 *     description: Use AI to generate comprehensive treatment plan based on symptoms and diagnosis
 *     tags: [Clinical Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - symptoms
 *               - diagnosis
 *             properties:
 *               symptoms:
 *                 type: string
 *                 description: Patient symptoms
 *               diagnosis:
 *                 type: string
 *                 description: Diagnosis
 *               useGemini:
 *                 type: boolean
 *                 description: Use Gemini AI instead of OpenAI
 *     responses:
 *       200:
 *         description: Treatment plan generated successfully
 *       400:
 *         description: Validation error
 */
router.post('/ai/treatment-plan', protect, authorize('doctor'), generateAITreatmentPlan);

/**
 * @swagger
 * /api/clinical-notes/ai/prescription:
 *   post:
 *     summary: Generate prescription suggestions using AI
 *     description: Use AI to generate prescription based on clinical note
 *     tags: [Clinical Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - noteId
 *             properties:
 *               noteId:
 *                 type: string
 *                 description: Clinical note ID
 *               useGemini:
 *                 type: boolean
 *                 description: Use Gemini AI instead of OpenAI
 *     responses:
 *       200:
 *         description: Prescription generated successfully
 *       404:
 *         description: Clinical note not found
 */
router.post('/ai/prescription', protect, authorize('doctor'), generateAIPrescription);

/**
 * @swagger
 * /api/clinical-notes/ai/summarize:
 *   post:
 *     summary: Summarize consultation using AI
 *     description: Use AI to generate concise summary of consultation transcript
 *     tags: [Clinical Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transcript
 *             properties:
 *               transcript:
 *                 type: string
 *                 description: Consultation transcript
 *               useGemini:
 *                 type: boolean
 *                 description: Use Gemini AI instead of OpenAI
 *     responses:
 *       200:
 *         description: Consultation summarized successfully
 *       400:
 *         description: Validation error
 */
router.post('/ai/summarize', protect, authorize('doctor'), summarizeAIConsultation);

module.exports = router;
