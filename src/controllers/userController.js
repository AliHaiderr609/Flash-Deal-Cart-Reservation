const userService = require('../services/userService');
const { validationResult } = require('express-validator');

class UserController {
  /**
   * Create a new user
   */
  async createUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const user = await userService.createUser(req.body);
      
      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get user by userId
   */
  async getUser(req, res) {
    try {
      const { userId } = req.params;
      
      const user = await userService.getUserById(userId);
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new UserController();

