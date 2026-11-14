import express from 'express';
import {
  getSiteSettings,
  getAdminSettings,
  updateSiteSettings,
  getFAQs,
  createFAQItem,
  updateFAQItem,
  deleteFAQItem,
  updateFAQ,
  getTestimonials,
  createTestimonialItem,
  updateTestimonialItem,
  deleteTestimonialItem,
  updateTestimonials,
} from '../controllers/settings.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// Public
router.get('/', getSiteSettings);
router.get('/faqs', getFAQs);
router.get('/testimonials', getTestimonials);

// Admin
router.get('/admin', protect, restrictTo('admin'), getAdminSettings);
router.patch('/', protect, restrictTo('admin'), updateSiteSettings);
router.patch('/faqs', protect, restrictTo('admin'), updateFAQ);
router.post('/faqs', protect, restrictTo('admin'), createFAQItem);
router.patch('/faqs/:id', protect, restrictTo('admin'), updateFAQItem);
router.delete('/faqs/:id', protect, restrictTo('admin'), deleteFAQItem);
router.patch('/testimonials', protect, restrictTo('admin'), updateTestimonials);
router.post('/testimonials', protect, restrictTo('admin'), createTestimonialItem);
router.patch('/testimonials/:id', protect, restrictTo('admin'), updateTestimonialItem);
router.delete('/testimonials/:id', protect, restrictTo('admin'), deleteTestimonialItem);

export default router;
