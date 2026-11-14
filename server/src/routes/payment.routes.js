import express from 'express';
import {
  initializePayment,
  verifyPayment,
  paystackWebhook,
  getMyPayments,
  getAllPayments,
  getPaymentById,
} from '../controllers/payment.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { initializePaymentValidator } from '../validators/payment.validator.js';

const router = express.Router();

// Webhook (public — verified via HMAC signature)
router.post('/webhook/paystack', paystackWebhook);

// Protected student routes
router.post('/initialize', protect, initializePaymentValidator, validate, initializePayment);
router.get('/verify/:ref', protect, verifyPayment);
router.get('/my', protect, getMyPayments);

// Admin routes
router.get('/', protect, restrictTo('admin'), getAllPayments);
router.get('/:id', protect, restrictTo('admin'), getPaymentById);

export default router;
