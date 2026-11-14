import express from 'express';
import {
  getAllCourses,
  getFeaturedCourses,
  getCourseBySlug,
  createCourse,
  updateCourse,
  deleteCourse,
  togglePublish,
  uploadThumbnail as uploadCourseThumbnail,
  getCourseStats,
} from '../controllers/course.controller.js';
import { getLessonsByCourse } from '../controllers/lesson.controller.js';
import { getModulesByCourse } from '../controllers/module.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { uploadThumbnail } from '../middleware/upload.js';
import auditLog from '../middleware/auditLog.js';

const router = express.Router();

// Public routes
router.get('/', getAllCourses);
router.get('/featured', getFeaturedCourses);
router.get('/:slug', getCourseBySlug);

// Protected course sub-resources
router.get('/:courseId/lessons', protect, getLessonsByCourse);
router.get('/:courseId/modules', protect, getModulesByCourse);

// Admin routes
router.post('/', protect, restrictTo('admin'), auditLog('CREATE_COURSE', 'Course'), createCourse);
router.patch('/:id', protect, restrictTo('admin'), auditLog('UPDATE_COURSE', 'Course'), updateCourse);
router.delete('/:id', protect, restrictTo('admin'), auditLog('DELETE_COURSE', 'Course'), deleteCourse);
router.patch('/:id/publish', protect, restrictTo('admin'), auditLog('TOGGLE_PUBLISH_COURSE', 'Course'), togglePublish);
router.patch('/:id/toggle-publish', protect, restrictTo('admin'), auditLog('TOGGLE_PUBLISH_COURSE', 'Course'), togglePublish);
router.patch('/:id/thumbnail', protect, restrictTo('admin'), uploadThumbnail, uploadCourseThumbnail);
router.get('/:id/stats', protect, restrictTo('admin'), getCourseStats);

export default router;
