const Order = require('../models/Order');
const productService = require('./productService');
const redisService = require('./redisService');
const cartService = require('./cartService');
const userService = require('./userService');

class CheckoutService {
  /**
   * Process checkout for a user
   * Validates reservations, reduces stock, creates order, and releases reservations
   */
  async processCheckout(userId) {
    // Validate user exists
    const userExists = await userService.userExists(userId);
    if (!userExists) {
      throw new Error('User not found');
    }

    // Get user's cart
    const cart = await cartService.getUserCart(userId);
    
    if (cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Validate all items are still available and reserved
    const validationErrors = [];
    for (const item of cart.items) {
      const reservedQty = await redisService.getReservedQuantity(userId, item.sku);
      if (reservedQty < item.quantity) {
        validationErrors.push(
          `Quantity mismatch for ${item.sku}. Reserved: ${reservedQty}, Cart: ${item.quantity}`
        );
      }

      const stockCheck = await productService.checkStockAvailability(item.sku, item.quantity);
      if (!stockCheck.isAvailable) {
        validationErrors.push(
          `Insufficient stock for ${item.sku}. Available: ${stockCheck.availableStock}, Required: ${item.quantity}`
        );
      }
    }

    if (validationErrors.length > 0) {
      throw new Error(`Checkout validation failed: ${validationErrors.join('; ')}`);
    }

    // Create order in database
    const orderItems = cart.items.map(item => ({
      productId: item.productId,
      sku: item.sku,
      quantity: item.quantity,
      price: item.price,
    }));

    const order = new Order({
      userId: userId, // MongoDB ObjectId (validated in middleware)
      items: orderItems,
      totalAmount: cart.totalAmount,
      status: 'completed',
    });

    await order.save();

    // Reduce stock permanently in database
    for (const item of cart.items) {
      await productService.reduceStock(item.sku, item.quantity);
    }

    // Release reservations from Redis
    for (const item of cart.items) {
      await redisService.releaseReservation(userId, item.sku, item.quantity);
    }

    return {
      success: true,
      orderId: order._id,
      userId,
      items: orderItems,
      totalAmount: cart.totalAmount,
      message: 'Checkout completed successfully',
    };
  }
}

module.exports = new CheckoutService();

