import { body } from 'express-validator';

export const createCourseValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Course title is required')
    .isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Course description is required'),

  body('category')
    .notEmpty().withMessage('Category is required')
    .isMongoId().withMessage('Invalid category ID'),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isNumeric().withMessage('Price must be a number')
    .custom((val) => val >= 0).withMessage('Price cannot be negative'),

  body('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid level'),

  body('discountPrice')
    .optional()
    .isNumeric().withMessage('Discount price must be a number')
    .custom((val) => val >= 0).withMessage('Discount price cannot be negative'),
];

export const updateCourseValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters'),

  body('price')
    .optional()
    .isNumeric().withMessage('Price must be a number')
    .custom((val) => val >= 0).withMessage('Price cannot be negative'),

  body('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid level'),
];
