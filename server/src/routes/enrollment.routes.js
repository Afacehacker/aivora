import express from 'express';
import {
  getMyEnrollments,
  checkEnrollment,
  updateProgress,
  getLastWatched,
} from '../controllers/enrollment.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/my', getMyEnrollments);
router.get('/check/:courseId', checkEnrollment);
router.patch('/progress', updateProgress);
router.patch('/progress/:lessonId', updateProgress);
router.get('/last-watched/:courseId', getLastWatched);

export default router;
