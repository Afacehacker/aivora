import express from 'express';
import {
  getMyNotifications,
  markAsRead,
  deleteNotification,
} from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyNotifications);
router.patch('/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
