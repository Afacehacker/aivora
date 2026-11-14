import { body } from 'express-validator';

export const initializePaymentValidator = [
  body('courseId')
    .notEmpty().withMessage('Course ID is required')
    .isMongoId().withMessage('Invalid course ID'),

  body('provider')
    .optional()
    .isIn(['paystack', 'flutterwave']).withMessage('Invalid payment provider'),

  body('couponCode')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Coupon code cannot exceed 20 characters'),
];
