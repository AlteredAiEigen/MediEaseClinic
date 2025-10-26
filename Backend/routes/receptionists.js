const express = require('express');
const { getReceptionists, getReceptionist, updateReceptionist, deleteReceptionist } = require('../controllers/receptionistController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Receptionist:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier
 *         firstName:
 *           type: string
 *           description: Receptionist's first name
 *         lastName:
 *           type: string
 *           description: Receptionist's last name
 *         email:
 *           type: string
 *           format: email
 *           description: Receptionist's email address
 *         phone:
 *           type: string
 *           description: Receptionist's phone number
 *         isActive:
 *           type: boolean
 *           description: Account status
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const router = express.Router();

/**
 * @swagger
 * /api/receptionists:
 *   get:
 *     summary: Get all receptionists
 *     description: Retrieve a list of all receptionists (admin only)
 *     tags: [Receptionists]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Receptionists retrieved successfully
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
 *                     receptionists:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Receptionist'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 *       500:
 *         description: Server error
 */
router.get('/', protect, authorize('admin'), getReceptionists);

/**
 * @swagger
 * /api/receptionists/{id}:
 *   get:
 *     summary: Get single receptionist
 *     description: Retrieve detailed information about a specific receptionist (admin only)
 *     tags: [Receptionists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Receptionist ID
 *     responses:
 *       200:
 *         description: Receptionist retrieved successfully
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
 *                     receptionist:
 *                       $ref: '#/components/schemas/Receptionist'
 *       404:
 *         description: Receptionist not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 *       500:
 *         description: Server error
 */
router.get('/:id', protect, authorize('admin'), getReceptionist);

/**
 * @swagger
 * /api/receptionists/{id}:
 *   put:
 *     summary: Update receptionist
 *     description: Update receptionist information (admin only)
 *     tags: [Receptionists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Receptionist ID
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
 *               phone:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Receptionist updated successfully
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
 *                     receptionist:
 *                       $ref: '#/components/schemas/Receptionist'
 *       404:
 *         description: Receptionist not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 *       500:
 *         description: Server error
 */
router.put('/:id', protect, authorize('admin'), updateReceptionist);

/**
 * @swagger
 * /api/receptionists/{id}:
 *   delete:
 *     summary: Delete receptionist
 *     description: Delete a receptionist account (admin only)
 *     tags: [Receptionists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Receptionist ID
 *     responses:
 *       200:
 *         description: Receptionist deleted successfully
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
 *                   example: "Receptionist deleted successfully"
 *       404:
 *         description: Receptionist not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 *       500:
 *         description: Server error
 */
router.delete('/:id', protect, authorize('admin'), deleteReceptionist);

module.exports = router;
