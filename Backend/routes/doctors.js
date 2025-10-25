const express = require('express');
const { getDoctors, getDoctor, updateDoctor, deleteDoctor, getDoctorStats } = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Doctor:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier
 *         firstName:
 *           type: string
 *           description: Doctor's first name
 *         lastName:
 *           type: string
 *           description: Doctor's last name
 *         email:
 *           type: string
 *           format: email
 *           description: Doctor's email address
 *         speciality:
 *           type: string
 *           description: Doctor's medical speciality
 *         licenseNumber:
 *           type: string
 *           description: Medical license number
 *         phone:
 *           type: string
 *           description: Doctor's phone number
 *         isActive:
 *           type: boolean
 *           description: Account status
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     DoctorStats:
 *       type: object
 *       properties:
 *         totalDoctors:
 *           type: integer
 *           description: Total number of doctors
 *         activeDoctors:
 *           type: integer
 *           description: Number of active doctors
 *         doctorsBySpeciality:
 *           type: object
 *           description: Count of doctors by speciality
 *         averageAppointmentsPerDoctor:
 *           type: number
 *           description: Average appointments per doctor
 */

const router = express.Router();

/**
 * @swagger
 * /api/doctors:
 *   get:
 *     summary: Get all doctors
 *     description: Retrieve a list of all doctors with optional filtering and pagination
 *     tags: [Doctors]
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
 *         name: speciality
 *         schema:
 *           type: string
 *         description: Filter by medical speciality
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Doctors retrieved successfully
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
 *                     doctors:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Doctor'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/', protect, getDoctors);

/**
 * @swagger
 * /api/doctors/stats:
 *   get:
 *     summary: Get doctor statistics
 *     description: Retrieve statistical information about doctors
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctor statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DoctorStats'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/stats', protect, getDoctorStats);

/**
 * @swagger
 * /api/doctors/{id}:
 *   get:
 *     summary: Get single doctor
 *     description: Retrieve detailed information about a specific doctor
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Doctor retrieved successfully
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
 *                     doctor:
 *                       $ref: '#/components/schemas/Doctor'
 *       404:
 *         description: Doctor not found
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/:id', protect, getDoctor);

/**
 * @swagger
 * /api/doctors/{id}:
 *   put:
 *     summary: Update doctor
 *     description: Update doctor information (admin only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *               lastName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *               speciality:
 *                 type: string
 *                 maxLength: 100
 *               licenseNumber:
 *                 type: string
 *                 maxLength: 50
 *               phone:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Doctor updated successfully
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
 *                     doctor:
 *                       $ref: '#/components/schemas/Doctor'
 *       404:
 *         description: Doctor not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 *       500:
 *         description: Server error
 */
router.put('/:id', protect, authorize('admin'), updateDoctor);

/**
 * @swagger
 * /api/doctors/{id}:
 *   delete:
 *     summary: Delete doctor
 *     description: Delete a doctor account (admin only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Doctor deleted successfully
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
 *                   example: "Doctor deleted successfully"
 *       404:
 *         description: Doctor not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 *       500:
 *         description: Server error
 */
router.delete('/:id', protect, authorize('admin'), deleteDoctor);

module.exports = router;
