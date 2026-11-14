import express from 'express';
import {
  validateCoupon,
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
} from '../controllers/coupon.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// Authenticated student/public coupon validation
router.post('/validate', protect, validateCoupon);

// Admin
router.get('/', protect, restrictTo('admin'), getAllCoupons);
router.post('/', protect, restrictTo('admin'), createCoupon);
router.patch('/:id', protect, restrictTo('admin'), updateCoupon);
router.delete('/:id', protect, restrictTo('admin'), deleteCoupon);

export default router;
