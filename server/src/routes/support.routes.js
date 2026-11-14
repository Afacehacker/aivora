import express from 'express';
import {
  createTicket,
  getMyTickets,
  getTicketById,
  replyToTicket,
  updateTicketStatus,
  getAllTickets,
} from '../controllers/support.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createTicketValidator, replyValidator } from '../validators/support.validator.js';

const router = express.Router();

router.use(protect);

// Student
router.post('/', createTicketValidator, validate, createTicket);
router.get('/my', getMyTickets);

// Admin list all
router.get('/', restrictTo('admin'), getAllTickets);

// Shared / Admin
router.get('/:id', getTicketById);
router.post('/:id/reply', replyValidator, validate, replyToTicket);
router.patch('/:id/status', restrictTo('admin'), updateTicketStatus);

export default router;
