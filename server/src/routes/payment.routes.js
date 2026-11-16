import express from 'express';
import {
  getManualPaymentDetails,
  initializePayment,
  verifyPayment,
  updatePaymentStatus,
  getMyPayments,
  getAllPayments,
  getPaymentById,
} from '../controllers/payment.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { initializePaymentValidator } from '../validators/payment.validator.js';
import { uploadMediaFile } from '../middleware/upload.js';
import { handleMediaUpload } from '../controllers/upload.controller.js';

const router = express.Router();

// Public/Student: fetch active bank accounts & OPay gateway notice
router.get('/accounts', getManualPaymentDetails);

// Protected student routes: allow all users to upload receipts from local files and submit payment proof
router.post('/upload-receipt', protect, uploadMediaFile, handleMediaUpload);
router.post('/initialize', protect, initializePaymentValidator, validate, initializePayment);
router.get('/verify/:ref', protect, verifyPayment);
router.get('/my', protect, getMyPayments);

// Admin routes
router.get('/', protect, restrictTo('admin'), getAllPayments);
router.get('/:id', protect, restrictTo('admin'), getPaymentById);
router.patch('/:id/status', protect, restrictTo('admin'), updatePaymentStatus);

export default router;
