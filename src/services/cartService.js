const productService = require('./productService');
const redisService = require('./redisService');
const userService = require('./userService');

class CartService {
  /**
   * Reserve items in cart for a user
   * Supports multiple SKUs in a single transaction
   */
  async reserveItems(userId, items, ttlSeconds) {
    // Validate user exists
    const userExists = await userService.userExists(userId);
    if (!userExists) {
      throw new Error('User not found');
    }
    const results = [];
    const reservedItems = [];
    
    try {
      // First, validate all items and check stock availability
      for (const item of items) {
        const { sku, quantity } = item;
        
        // Validate item
        if (!sku || !quantity || quantity <= 0) {
          throw new Error(`Invalid item: ${JSON.stringify(item)}`);
        }

        // Check stock availability
        const stockCheck = await productService.checkStockAvailability(sku, quantity);
        if (!stockCheck.isAvailable) {
          throw new Error(
            `Insufficient stock for SKU ${sku}. Available: ${stockCheck.availableStock}, Requested: ${quantity}`
          );
        }

        // Reserve stock in Redis
        await redisService.reserveStock(userId, sku, quantity, ttlSeconds);
        reservedItems.push({ sku, quantity });
      }

      return {
        success: true,
        userId,
        reservedItems,
        message: 'Items reserved successfully',
      };
    } catch (error) {
      // Rollback: cancel all reservations made so far
      for (const item of reservedItems) {
        try {
          await redisService.cancelReservation(userId, item.sku, item.quantity);
        } catch (rollbackError) {
          console.error('Error during rollback:', rollbackError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Get user's cart (all reservations)
   */
  async getUserCart(userId) {
    const reservations = await redisService.getUserReservations(userId);
    const cartItems = [];

    for (const reservation of reservations) {
      try {
        const product = await productService.getProductBySku(reservation.sku);
        cartItems.push({
          productId: product._id,
          sku: product.sku,
          name: product.name,
          price: product.price,
          quantity: reservation.quantity,
          totalPrice: product.price * reservation.quantity,
        });
      } catch (error) {
        // Product might have been deleted or is inactive
        console.error(`Error fetching product ${reservation.sku}:`, error);
      }
    }

    return {
      userId,
      items: cartItems,
      totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
    };
  }

  /**
   * Cancel reservation for specific items
   */
  async cancelReservation(userId, items) {
    // Validate user exists
    const userExists = await userService.userExists(userId);
    if (!userExists) {
      throw new Error('User not found');
    }

    const cancelledItems = [];

    for (const item of items) {
      const { sku, quantity } = item;
      
      if (!sku) {
        throw new Error('SKU is required for cancellation');
      }

      const cancelledQty = await redisService.cancelReservation(
        userId,
        sku,
        quantity || null
      );
      
      if (cancelledQty > 0) {
        cancelledItems.push({ sku, quantity: cancelledQty });
      }
    }

    return {
      success: true,
      userId,
      cancelledItems,
      message: 'Reservations cancelled successfully',
    };
  }
}

module.exports = new CartService();

