const cartService = require('../services/cartService');
const { validationResult } = require('express-validator');

class CartController {

  /**
   * Reserve items in cart for a user
   * Supports multiple SKUs in a single transaction
   * @param {object} req.body - Request body containing userId and items
   * @param {object} res - Response object
   * @returns {object} - Response object with success, data, and message
   * @throws {Error} - Error if validation fails or service throws an error
   */
  async reserveItems(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { userId } = req.body;
      const { items } = req.body;
      const ttlSeconds = parseInt(process.env.RESERVATION_TTL_SECONDS) || 600;

      const result = await cartService.reserveItems(userId, items, ttlSeconds);
      
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }


  /**
   * Get user's cart (all reservations)
   * @param {object} req.params - Request parameters containing userId
   * @param {object} res - Response object
   * @returns {object} - Response object with success, data, and message
   * @throws {Error} - Error if service throws an error
   */
  async getUserCart(req, res) {
    try {
      const { userId } = req.params;
      
      const cart = await cartService.getUserCart(userId);
      
      res.json({
        success: true,
        data: cart,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Cancel reservations for a user
   * Supports multiple SKUs in a single transaction
   * @param {object} req.body - Request body containing userId and items
   * @param {object} res - Response object
   * @returns {object} - Response object with success, data, and message
   * @throws {Error} - Error if validation fails or service throws an error
   */
  async cancelReservation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { userId } = req.body;
      const { items } = req.body;

      const result = await cartService.cancelReservation(userId, items);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new CartController();

