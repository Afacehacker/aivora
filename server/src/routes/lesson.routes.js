import express from 'express';
import {
  getLessonsByCourse,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
} from '../controllers/lesson.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { uploadVideo } from '../middleware/upload.js';
import auditLog from '../middleware/auditLog.js';

const router = express.Router();

router.get('/course/:courseId', protect, getLessonsByCourse);
router.get('/:id', protect, getLesson);

// Admin only
router.post('/', protect, restrictTo('admin'), uploadVideo, auditLog('CREATE_LESSON', 'Lesson'), createLesson);
router.patch('/:id', protect, restrictTo('admin'), uploadVideo, auditLog('UPDATE_LESSON', 'Lesson'), updateLesson);
router.delete('/:id', protect, restrictTo('admin'), auditLog('DELETE_LESSON', 'Lesson'), deleteLesson);
router.patch('/module/:moduleId/reorder', protect, restrictTo('admin'), reorderLessons);

export default router;
