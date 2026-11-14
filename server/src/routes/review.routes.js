import express from 'express';
import {
  createReview,
  getCourseReviews,
  approveReview,
  deleteReview,
  getAllReviews,
} from '../controllers/review.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createReviewValidator } from '../validators/review.validator.js';

const router = express.Router();

// Public
router.get('/course/:courseId', getCourseReviews);

// Student
router.post('/', protect, createReviewValidator, validate, createReview);
router.post('/:courseId', protect, createReviewValidator, validate, createReview);
router.delete('/:id', protect, deleteReview);

// Admin
router.get('/', protect, restrictTo('admin'), getAllReviews);
router.patch('/:id/approve', protect, restrictTo('admin'), approveReview);
router.patch('/:id/status', protect, restrictTo('admin'), approveReview);

export default router;
