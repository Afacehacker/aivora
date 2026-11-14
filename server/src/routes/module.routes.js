import express from 'express';
import {
  getModulesByCourse,
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
} from '../controllers/module.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';
import auditLog from '../middleware/auditLog.js';

const router = express.Router();

router.get('/course/:courseId', protect, getModulesByCourse);

// Admin only
router.post('/', protect, restrictTo('admin'), auditLog('CREATE_MODULE', 'Module'), createModule);
router.patch('/:id', protect, restrictTo('admin'), auditLog('UPDATE_MODULE', 'Module'), updateModule);
router.delete('/:id', protect, restrictTo('admin'), auditLog('DELETE_MODULE', 'Module'), deleteModule);
router.patch('/course/:courseId/reorder', protect, restrictTo('admin'), reorderModules);

export default router;
