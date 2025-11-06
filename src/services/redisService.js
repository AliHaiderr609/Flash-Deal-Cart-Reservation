const { getRedisClient } = require('../config/redis');

class RedisService {
  /**
   * Reserve stock for a user
   * @param {string} userId - User ID
   * @param {string} sku - Product SKU
   * @param {number} quantity - Quantity to reserve
   * @param {number} ttlSeconds - Time to live in seconds
   * @returns {Promise<boolean>} - Returns true if reservation successful
   */
  async reserveStock(userId, sku, quantity, ttlSeconds) {
    const client = getRedisClient();
    const reservationKey = this.getReservationKey(userId, sku);
    const reservedStockKey = this.getReservedStockKey(sku);
    
    try {
      const existingReservation = await client.get(reservationKey);
      const existingQty = existingReservation ? parseInt(existingReservation) : 0;
      const newQty = existingQty + quantity;

      const multi = client.multi();
      multi.setEx(reservationKey, ttlSeconds, newQty.toString());
      
      multi.incrBy(reservedStockKey, quantity);
      multi.expire(reservedStockKey, ttlSeconds);
      
      const results = await multi.exec();
      return true;
    } catch (error) {
      console.error('Error reserving stock in Redis:', error);
      throw error;
    }
  }

  /**
   * Get user's reserved quantity for a SKU
   * @param {string} userId - User ID
   * @param {string} sku - Product SKU
   * @returns {Promise<number>} - Reserved quantity
   */
  async getReservedQuantity(userId, sku) {
    const client = getRedisClient();
    const reservationKey = this.getReservationKey(userId, sku);
    
    try {
      const reserved = await client.get(reservationKey);
      return reserved ? parseInt(reserved) : 0;
    } catch (error) {
      console.error('Error getting reserved quantity:', error);
      return 0;
    }
  }

  /**
   * Get total reserved stock for a SKU (across all users)
   * @param {string} sku - Product SKU
   * @returns {Promise<number>} - Total reserved quantity
   */
  async getTotalReservedStock(sku) {
    const client = getRedisClient();
    const reservedStockKey = this.getReservedStockKey(sku);
    
    try {
      const reserved = await client.get(reservedStockKey);
      return reserved ? parseInt(reserved) : 0;
    } catch (error) {
      console.error('Error getting total reserved stock:', error);
      return 0;
    }
  }

  /**
   * Cancel reservation for a user and SKU
   * @param {string} userId - User ID
   * @param {string} sku - Product SKU
   * @param {number} quantity - Quantity to cancel (optional, cancels all if not provided)
   * @returns {Promise<number>} - Cancelled quantity
   */
  async cancelReservation(userId, sku, quantity = null) {
    const client = getRedisClient();
    const reservationKey = this.getReservationKey(userId, sku);
    const reservedStockKey = this.getReservedStockKey(sku);
    
    try {
      const existingReservation = await client.get(reservationKey);
      if (!existingReservation) {
        return 0;
      }

      const existingQty = parseInt(existingReservation);
      const cancelQty = quantity !== null ? Math.min(quantity, existingQty) : existingQty;
      const remainingQty = existingQty - cancelQty;

      const multi = client.multi();
      
      if (remainingQty > 0) {
       
        const ttl = await client.ttl(reservationKey);
        if (ttl > 0) {
          multi.setEx(reservationKey, ttl, remainingQty.toString());
        } else {
          multi.setEx(reservationKey, 600, remainingQty.toString()); 
        }
      } else {
        multi.del(reservationKey);
      }
      
      // Decrease reserved stock count
      multi.decrBy(reservedStockKey, cancelQty);
      
      await multi.exec();
      return cancelQty;
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      throw error;
    }
  }

  /**
   * Release reserved stock (used during checkout)
   * @param {string} userId - User ID
   * @param {string} sku - Product SKU
   * @param {number} quantity - Quantity to release
   * @returns {Promise<boolean>}
   */
  async releaseReservation(userId, sku, quantity) {
    const client = getRedisClient();
    const reservationKey = this.getReservationKey(userId, sku);
    const reservedStockKey = this.getReservedStockKey(sku);
    
    try {
      const existingReservation = await client.get(reservationKey);
      if (!existingReservation) {
        return false;
      }

      const existingQty = parseInt(existingReservation);
      if (existingQty < quantity) {
        throw new Error('Cannot release more than reserved');
      }

      const remainingQty = existingQty - quantity;
      const multi = client.multi();
      
      if (remainingQty > 0) {
        const ttl = await client.ttl(reservationKey);
        if (ttl > 0) {
          multi.setEx(reservationKey, ttl, remainingQty.toString());
        } else {
          multi.setEx(reservationKey, 600, remainingQty.toString()); // Default TTL if expired
        }
      } else {
        multi.del(reservationKey);
      }
      
      multi.decrBy(reservedStockKey, quantity);
      await multi.exec();
      return true;
    } catch (error) {
      console.error('Error releasing reservation:', error);
      throw error;
    }
  }

  /**
   * Get all reservations for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of {sku, quantity} objects
   */
  async getUserReservations(userId) {
    const client = getRedisClient();
    const pattern = this.getReservationKey(userId, '*');
    
    try {
      const keys = await client.keys(pattern);
      const reservations = [];
      
      for (const key of keys) {
        const quantity = await client.get(key);
        const sku = key.split(':')[2]; 
        if (quantity) {
          reservations.push({ sku, quantity: parseInt(quantity) });
        }
      }
      
      return reservations;
    } catch (error) {
      console.error('Error getting user reservations:', error);
      return [];
    }
  }

  /**
   * Generate reservation key for Redis
   * @private
   */
  getReservationKey(userId, sku) {
    return `reservation:${userId}:${sku}`;
  }

  /**
   * Generate reserved stock key for Redis
   * @private
   */
  getReservedStockKey(sku) {
    return `reserved_stock:${sku}`;
  }
}

module.exports = new RedisService();

