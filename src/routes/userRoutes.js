const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { userValidations } = require('../middleware/validation');
const { apiLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  apiLimiter,
  userValidations.createUser,
  userController.createUser.bind(userController)
);

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Get user by userId
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *         description: MongoDB ObjectId of the user
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get(
  '/:userId',
  apiLimiter,
  userValidations.getUser,
  userController.getUser.bind(userController)
);

module.exports = router;

