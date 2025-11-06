const { body, param } = require('express-validator');
const mongoose = require('mongoose');

const productValidations = {
  createProduct: [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('sku').trim().notEmpty().withMessage('SKU is required'),
    body('totalStock')
      .isInt({ min: 0 })
      .withMessage('Total stock must be a non-negative integer'),
    body('price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a non-negative number'),
    body('description').optional().trim(),
  ],
  getProductStatus: [
    param('sku').trim().notEmpty().withMessage('SKU is required'),
  ],
};

const cartValidations = {
  reserveItems: [
    body('userId')
      .trim()
      .notEmpty()
      .withMessage('User ID is required')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid user ID format. Must be a valid MongoDB ObjectId');
        }
        return true;
      }),
    body('items')
      .isArray({ min: 1 })
      .withMessage('Items must be a non-empty array'),
    body('items.*.sku')
      .trim()
      .notEmpty()
      .withMessage('SKU is required for each item'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer for each item'),
  ],
  getUserCart: [
    param('userId')
      .trim()
      .notEmpty()
      .withMessage('User ID is required')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid user ID format. Must be a valid MongoDB ObjectId');
        }
        return true;
      }),
  ],
  cancelReservation: [
    body('userId')
      .trim()
      .notEmpty()
      .withMessage('User ID is required')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid user ID format. Must be a valid MongoDB ObjectId');
        }
        return true;
      }),
    body('items')
      .isArray({ min: 1 })
      .withMessage('Items must be a non-empty array'),
    body('items.*.sku')
      .trim()
      .notEmpty()
      .withMessage('SKU is required for each item'),
    body('items.*.quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer if provided'),
  ],
};

const checkoutValidations = {
  checkout: [
    body('userId')
      .trim()
      .notEmpty()
      .withMessage('User ID is required')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid user ID format. Must be a valid MongoDB ObjectId');
        }
        return true;
      }),
  ],
};

const userValidations = {
  createUser: [
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('name').optional().trim(),
  ],
  getUser: [
    param('userId')
      .trim()
      .notEmpty()
      .withMessage('User ID is required')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid user ID format. Must be a valid MongoDB ObjectId');
        }
        return true;
      }),
  ],
};

module.exports = {
  productValidations,
  cartValidations,
  checkoutValidations,
  userValidations,
};

