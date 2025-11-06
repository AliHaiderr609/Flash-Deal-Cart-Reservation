const mongoose = require('mongoose');
const User = require('../models/User');

class UserService {

  /**
   * Get user by MongoDB ObjectId
   * @param {string} userId - MongoDB ObjectId of user
   * @returns {Promise<object>} - Found user
   * @throws {Error} - Error if user not found or invalid user ID format
   */
  async getUserById(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }
    const user = await User.findById(userId).where({ isActive: true });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

 
  /**
   * Check if a user exists
   * @param {string} userId - MongoDB ObjectId of user
   * @returns {Promise<boolean>} - True if user exists, false otherwise
   */
  async userExists(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return false;
    }
    const user = await User.findById(userId).where({ isActive: true });
    return !!user;
  }

 
  /**
   * Get user by email address
   * @param {string} email - Email address of user
   * @returns {Promise<object>} - Found user
   * @throws {Error} - Error if user not found
   */
  async getUserByEmail(email) {
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

 
  /**
   * Create a new user
   * @param {object} userData - User data containing email, name, and password
   * @returns {Promise<object>} - Created user
   * @throws {Error} - Error if user with same userId already exists or if service throws an error
   */
  async createUser(userData) {
    try {
      const user = new User(userData);
      await user.save();
      return user;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('User with this userId already exists');
      }
      throw error;
    }
  }
}

module.exports = new UserService();

