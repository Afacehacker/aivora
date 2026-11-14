import express from 'express';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// Public
router.get('/', getAllCategories);

// Admin
router.post('/', protect, restrictTo('admin'), createCategory);
router.patch('/:id', protect, restrictTo('admin'), updateCategory);
router.delete('/:id', protect, restrictTo('admin'), deleteCategory);

export default router;
