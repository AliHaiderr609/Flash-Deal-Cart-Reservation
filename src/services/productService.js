const Product = require('../models/Product');
const redisService = require('./redisService');

class ProductService {

  /**
   * Create a new product
   * @param {object} productData - Product data containing name, sku, totalStock, price, and description
   * @returns {Promise<object>} - Created product
   * @throws {Error} - Error if product with same SKU already exists or if service throws an error
   */
  async createProduct(productData) {
    try {
      const product = new Product(productData);
      await product.save();
      return product;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Product with this SKU already exists');
      }
      throw error;
    }
  }

  
  /**
   * Get product by SKU
   * @param {string} sku - Product SKU
   * @returns {Promise<object>} - Found product
   * @throws {Error} - Error if product not found
   */
  async getProductBySku(sku) {
    const product = await Product.findOne({ sku, isActive: true });
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

 
  /**
   * Get product by ID
   * @param {string} productId - Product ID
   * @returns {Promise<object>} - Found product
   * @throws {Error} - Error if product not found
   */
  async getProductById(productId) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  
  /**
   * Get product status including stock information
   * @param {string} sku - Product SKU
   * @returns {Promise<object>} - Response object with product status
   * @property {string} productId - Product ID
   * @property {string} name - Product name
   * @property {string} sku - Product SKU
   * @property {number} totalStock - Total available stock
   * @property {number} reservedStock - Total reserved stock
   * @property {number} availableStock - Available stock (totalStock - reservedStock)
   * @property {number} price - Product price
   * @property {boolean} isActive - Product active status
   * @throws {Error} - Error if product not found
   */
  async getProductStatus(sku) {
    const product = await this.getProductBySku(sku);
    const reservedStock = await redisService.getTotalReservedStock(sku);
    const availableStock = Math.max(0, product.totalStock - reservedStock);

    return {
      productId: product._id,
      name: product.name,
      sku: product.sku,
      totalStock: product.totalStock,
      reservedStock: reservedStock,
      availableStock: availableStock,
      price: product.price,
      isActive: product.isActive,
    };
  }

  
  /**
   * Check if a product has enough available stock
   * @param {string} sku - Product SKU
   * @param {number} quantity - Quantity to check
   * @returns {Promise<object>} - Response object with stock availability
   * @property {boolean} isAvailable - Whether the product has enough stock
   * @property {number} availableStock - Available stock (totalStock - reservedStock)
   * @property {number} totalStock - Total available stock
   * @property {number} reservedStock - Total reserved stock
   */
  async checkStockAvailability(sku, quantity) {
    const product = await this.getProductBySku(sku);
    const reservedStock = await redisService.getTotalReservedStock(sku);
    const availableStock = product.totalStock - reservedStock;
    
    return {
      isAvailable: availableStock >= quantity,
      availableStock: Math.max(0, availableStock),
      totalStock: product.totalStock,
      reservedStock: reservedStock,
    };
  }

 
  /**
   * Reduce stock for a product
   * @param {string} sku - Product SKU
   * @param {number} quantity - Quantity to reduce
   * @returns {Promise<object>} - Updated product object
   * @throws {Error} - Error if product not found or insufficient stock
   */
  async reduceStock(sku, quantity) {
    const product = await this.getProductBySku(sku);
    
    if (product.totalStock < quantity) {
      throw new Error('Insufficient stock');
    }

    product.totalStock -= quantity;
    await product.save();
    return product;
  }
}

module.exports = new ProductService();

