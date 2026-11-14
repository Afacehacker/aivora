import { body } from 'express-validator';

export const initializePaymentValidator = [
  body('courseId')
    .notEmpty().withMessage('Course ID is required')
    .isMongoId().withMessage('Invalid course ID'),

  body('senderName')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage('Sender name cannot exceed 120 characters'),

  body('senderBank')
    .optional()
    .trim()
    .custom((val) => {
      if (val && val.toLowerCase().includes('opay')) {
        throw new Error(
          'Payments from OPay cannot be received due to gateway problems. Please use another Nigerian bank such as PalmPay, Kuda, Moniepoint, UBA, Access Bank, FirstBank, etc.'
        );
      }
      return true;
    }),

  body('couponCode')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Coupon code cannot exceed 20 characters'),
];
