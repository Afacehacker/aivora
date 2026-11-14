import { body } from 'express-validator';

export const createTicketValidator = [
  body('subject')
    .trim()
    .notEmpty().withMessage('Subject is required')
    .isLength({ max: 200 }).withMessage('Subject cannot exceed 200 characters'),

  body('category')
    .optional()
    .isIn(['payment', 'access', 'technical', 'other']).withMessage('Invalid category'),

  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters'),
];

export const replyValidator = [
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters'),
];
