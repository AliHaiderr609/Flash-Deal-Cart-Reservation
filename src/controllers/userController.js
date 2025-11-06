const userService = require('../services/userService');
const { validationResult } = require('express-validator');

class UserController {

  /**
   * Create a new user
   * @param {object} req.body - Request body containing user data
   * @param {object} res - Response object
   * @returns {object} - Response object with success, data, and message
   * @throws {Error} - Error if validation fails or service throws an error
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
   * @param {object} req.params - Request parameters containing userId
   * @param {object} res - Response object
   * @returns {object} - Response object with success, data, and message
   * @throws {Error} - Error if service throws an error
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

