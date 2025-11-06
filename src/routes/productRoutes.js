const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { productValidations } = require('../middleware/validation');
const { apiLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - sku
 *               - totalStock
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               sku:
 *                 type: string
 *               totalStock:
 *                 type: integer
 *                 minimum: 0
 *               price:
 *                 type: number
 *                 minimum: 0
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  apiLimiter,
  productValidations.createProduct,
  productController.createProduct.bind(productController)
);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all active products with stock status
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of products with stock information
 */
router.get(
  '/',
  apiLimiter,
  productController.getAllProducts.bind(productController)
);

/**
 * @swagger
 * /api/products/{sku}/status:
 *   get:
 *     summary: Get product status including stock information
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: sku
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product status with stock details
 *       404:
 *         description: Product not found
 */
router.get(
  '/:sku/status',
  apiLimiter,
  productValidations.getProductStatus,
  productController.getProductStatus.bind(productController)
);

module.exports = router;

