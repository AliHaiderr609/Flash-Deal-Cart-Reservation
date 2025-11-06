const checkoutService = require('../services/checkoutService');
const { validationResult } = require('express-validator');

class CheckoutController {
 
/**
 * Process checkout for a user
 * Validates reservations, reduces stock, creates order, and releases reservations
 * @param {object} req.body - Request body containing userId
 * @param {object} res - Response object
 * @returns {object} - Response object with success, data, and message
 * @throws {Error} - Error if service throws an error
 */
  async checkout(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { userId } = req.body;

      const result = await checkoutService.processCheckout(userId);
      
      res.json({
        success: true,
        data: result,
        message: 'Checkout completed successfully',
      });
    } catch (error) {
      console.error('Checkout error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new CheckoutController();

