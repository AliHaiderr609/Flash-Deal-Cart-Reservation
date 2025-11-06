const Product = require('../models/Product');
const redisService = require('./redisService');

class ProductService {
  /**
   * Create a new product
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
   * Check if stock is available for reservation
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
   * Permanently reduce stock (used during checkout)
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

