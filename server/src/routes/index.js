import express from 'express';
import authRoutes from './auth.routes.js';
import courseRoutes from './course.routes.js';
import moduleRoutes from './module.routes.js';
import lessonRoutes from './lesson.routes.js';
import enrollmentRoutes from './enrollment.routes.js';
import paymentRoutes from './payment.routes.js';
import reviewRoutes from './review.routes.js';
import adminRoutes from './admin.routes.js';
import settingsRoutes from './settings.routes.js';
import supportRoutes from './support.routes.js';
import couponRoutes from './coupon.routes.js';
import categoryRoutes from './category.routes.js';
import certificateRoutes from './certificate.routes.js';
import notificationRoutes from './notification.routes.js';
import { protect } from '../middleware/auth.js';
import { updateProgress, getLastWatched } from '../controllers/enrollment.controller.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/modules', moduleRoutes);
router.use('/lessons', lessonRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);
router.use('/settings', settingsRoutes);
router.use('/support', supportRoutes);
router.use('/tickets', supportRoutes);
router.use('/coupons', couponRoutes);
router.use('/categories', categoryRoutes);
router.use('/certificates', certificateRoutes);
router.use('/notifications', notificationRoutes);

// Progress aliases for lessonService
router.patch('/progress/:lessonId', protect, updateProgress);
router.get('/progress/:courseId', protect, getLastWatched);

export default router;
