const productService = require('../services/productService');
const { validationResult } = require('express-validator');

class ProductController {
 
  /**
   * Create a new product
   * @param {object} req.body - Request body containing product data
   * @param {object} res - Response object
   * @returns {object} - Response object with success, data, and message
   * @throws {Error} - Error if validation fails or service throws an error
   */
  async createProduct(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const product = await productService.createProduct(req.body);
      
      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }


  /**
   * Get product status including stock information
   * @param {object} req.params - Request parameters containing sku
   * @param {object} res - Response object
   * @returns {object} - Response object with success, data, and message
   * @throws {Error} - Error if service throws an error
   */
  async getProductStatus(req, res) {
    try {
      const { sku } = req.params;
      
      const status = await productService.getProductStatus(sku);
      
      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

 
  /**
   * Get all active products with stock information
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @returns {object} - Response object with success, data, and message
   * @throws {Error} - Error if service throws an error
   */
  async getAllProducts(req, res) {
    try {
      const Product = require('../models/Product');
      const products = await Product.find({ isActive: true });
      
      // Get status for each product
      const productsWithStatus = await Promise.all(
        products.map(async (product) => {
          try {
            return await productService.getProductStatus(product.sku);
          } catch (error) {
            return {
              productId: product._id,
              name: product.name,
              sku: product.sku,
              totalStock: product.totalStock,
              reservedStock: 0,
              availableStock: product.totalStock,
              price: product.price,
              isActive: product.isActive,
            };
          }
        })
      );
      
      res.json({
        success: true,
        data: productsWithStatus,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new ProductController();

