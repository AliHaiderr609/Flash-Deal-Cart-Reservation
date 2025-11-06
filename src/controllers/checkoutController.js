const checkoutService = require('../services/checkoutService');
const { validationResult } = require('express-validator');

class CheckoutController {
  /**
   * Process checkout
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

