const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { cartValidations } = require('../middleware/validation');
const { reservationLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * /api/cart/reserve:
 *   post:
 *     summary: Reserve items in cart (temporary lock for 10 minutes)
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - items
 *             properties:
 *               userId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - sku
 *                     - quantity
 *                   properties:
 *                     sku:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *     responses:
 *       201:
 *         description: Items reserved successfully
 *       400:
 *         description: Validation error or insufficient stock
 */
router.post(
  '/reserve',
  reservationLimiter,
  cartValidations.reserveItems,
  cartController.reserveItems.bind(cartController)
);

/**
 * @swagger
 * /api/cart/{userId}:
 *   get:
 *     summary: Get user's cart with all reservations
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User's cart with reserved items
 */
router.get(
  '/:userId',
  cartValidations.getUserCart,
  cartController.getUserCart.bind(cartController)
);

/**
 * @swagger
 * /api/cart/cancel:
 *   post:
 *     summary: Cancel reservations
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - items
 *             properties:
 *               userId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - sku
 *                   properties:
 *                     sku:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       description: Optional, omit to cancel all for this SKU
 *     responses:
 *       200:
 *         description: Reservations cancelled successfully
 *       400:
 *         description: Validation error
 */
router.post(
  '/cancel',
  reservationLimiter,
  cartValidations.cancelReservation,
  cartController.cancelReservation.bind(cartController)
);

module.exports = router;

