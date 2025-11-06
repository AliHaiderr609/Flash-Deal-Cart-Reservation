const mongoose = require('mongoose');
const User = require('../models/User');

class UserService {
  /**
   * Get user by MongoDB ObjectId
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
   * Check if user exists by MongoDB ObjectId
   */
  async userExists(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return false;
    }
    const user = await User.findById(userId).where({ isActive: true });
    return !!user;
  }

  /**
   * Get user by email (alternative lookup)
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

