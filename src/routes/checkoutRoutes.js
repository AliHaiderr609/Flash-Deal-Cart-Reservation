const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { checkoutValidations } = require('../middleware/validation');
const { reservationLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * /api/checkout:
 *   post:
 *     summary: Process checkout and finalize purchase
 *     tags: [Checkout]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Checkout completed successfully
 *       400:
 *         description: Validation error, empty cart, or insufficient stock
 */
router.post(
  '/',
  reservationLimiter,
  checkoutValidations.checkout,
  checkoutController.checkout.bind(checkoutController)
);

module.exports = router;

