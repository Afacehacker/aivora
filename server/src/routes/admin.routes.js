import express from 'express';
import {
  getDashboardStats,
  getRevenueChart,
  getEnrollmentChart,
  getAllStudents,
  getStudentById,
  toggleStudentStatus,
  grantCourseAccess,
  revokeCourseAccess,
  getActivityLogs,
} from '../controllers/admin.controller.js';
import {
  getAllCourses,
  getCourseBySlug,
  createCourse,
  updateCourse,
  deleteCourse,
  togglePublish,
} from '../controllers/course.controller.js';
import {
  createModule,
  updateModule,
  deleteModule,
} from '../controllers/module.controller.js';
import {
  createLesson,
  updateLesson,
  deleteLesson,
} from '../controllers/lesson.controller.js';
import {
  getAllPayments,
  getPaymentById,
} from '../controllers/payment.controller.js';
import {
  getAllReviews,
  approveReview,
  deleteReview,
} from '../controllers/review.controller.js';
import {
  getAdminSettings,
  updateSiteSettings,
  getFAQs,
  createFAQItem,
  updateFAQItem,
  deleteFAQItem,
  getTestimonials,
  createTestimonialItem,
  updateTestimonialItem,
  deleteTestimonialItem,
} from '../controllers/settings.controller.js';
import {
  getAllTickets,
  getTicketById,
  replyToTicket,
  updateTicketStatus,
} from '../controllers/support.controller.js';
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/coupon.controller.js';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import {
  handleMediaUpload,
  listUploadedMedia,
} from '../controllers/upload.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { uploadMediaFile } from '../middleware/upload.js';
import auditLog from '../middleware/auditLog.js';

const router = express.Router();

router.use(protect, restrictTo('admin'));

// Media Upload & Media Library (Videos, Images, PDFs)
router.post('/upload', uploadMediaFile, auditLog('UPLOAD_MEDIA', 'Media'), handleMediaUpload);
router.get('/media', listUploadedMedia);

// Dashboard & Analytics
router.get('/dashboard', getDashboardStats);
router.get('/stats', getDashboardStats);
router.get('/revenue-chart', getRevenueChart);
router.get('/enrollment-chart', getEnrollmentChart);
router.get('/recent-purchases', getAllPayments);
router.get('/recent-students', getAllStudents);
router.get('/activity-logs', getActivityLogs);

// Courses
router.get('/courses', (req, res, next) => {
  req.query.all = 'true';
  return getAllCourses(req, res, next);
});
router.get('/courses/:id', getCourseBySlug);
router.post('/courses', auditLog('CREATE_COURSE', 'Course'), createCourse);
router.patch('/courses/:id', auditLog('UPDATE_COURSE', 'Course'), updateCourse);
router.delete('/courses/:id', auditLog('DELETE_COURSE', 'Course'), deleteCourse);
router.patch('/courses/:id/toggle-publish', auditLog('TOGGLE_PUBLISH_COURSE', 'Course'), togglePublish);
router.patch('/courses/:id/publish', auditLog('TOGGLE_PUBLISH_COURSE', 'Course'), togglePublish);

// Modules & Lessons under /admin
router.post('/courses/:courseId/modules', auditLog('CREATE_MODULE', 'Module'), createModule);
router.patch('/modules/:id', auditLog('UPDATE_MODULE', 'Module'), updateModule);
router.delete('/modules/:id', auditLog('DELETE_MODULE', 'Module'), deleteModule);
router.post('/modules/:moduleId/lessons', auditLog('CREATE_LESSON', 'Lesson'), createLesson);
router.patch('/lessons/:id', auditLog('UPDATE_LESSON', 'Lesson'), updateLesson);
router.delete('/lessons/:id', auditLog('DELETE_LESSON', 'Lesson'), deleteLesson);

// Students
router.get('/students', getAllStudents);
router.get('/students/:id', getStudentById);
router.patch('/students/:id/toggle-status', toggleStudentStatus);
router.patch('/students/:id/status', toggleStudentStatus);
router.post('/students/:id/grant-access', grantCourseAccess);
router.delete('/students/:id/revoke-access', revokeCourseAccess);

// Orders / Payments
router.get('/orders', getAllPayments);
router.get('/orders/:id', getPaymentById);

// Reviews
router.get('/reviews', getAllReviews);
router.patch('/reviews/:id/status', approveReview);
router.patch('/reviews/:id/approve', approveReview);
router.delete('/reviews/:id', deleteReview);

// Settings, FAQs, Testimonials
router.get('/settings', getAdminSettings);
router.patch('/settings', updateSiteSettings);
router.get('/faqs', getFAQs);
router.post('/faqs', createFAQItem);
router.patch('/faqs/:id', updateFAQItem);
router.delete('/faqs/:id', deleteFAQItem);
router.get('/testimonials', getTestimonials);
router.post('/testimonials', createTestimonialItem);
router.patch('/testimonials/:id', updateTestimonialItem);
router.delete('/testimonials/:id', deleteTestimonialItem);

// Support Tickets
router.get('/tickets', getAllTickets);
router.get('/tickets/:id', getTicketById);
router.post('/tickets/:id/reply', replyToTicket);
router.patch('/tickets/:id/status', updateTicketStatus);

// Coupons
router.get('/coupons', getAllCoupons);
router.post('/coupons', createCoupon);
router.patch('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Categories
router.get('/categories', (req, res, next) => {
  req.query.all = 'true';
  return getAllCategories(req, res, next);
});
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

export default router;
