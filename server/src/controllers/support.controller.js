import SupportTicket from '../models/SupportTicket.js';
import Notification from '../models/Notification.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../middleware/errorHandler.js';
import { successResponse, paginationMeta } from '../utils/apiResponse.js';
import { sendSupportReply } from '../services/email.service.js';

/**
 * POST /api/v1/support — Create ticket
 */
export const createTicket = catchAsync(async (req, res, next) => {
  const { subject, category, message, priority } = req.body;

  const ticket = await SupportTicket.create({
    student: req.user._id,
    subject,
    category: category || 'other',
    priority: priority || 'medium',
    messages: [{ sender: req.user._id, message }],
  });

  return successResponse(res, 201, 'Support ticket created.', ticket);
});

/**
 * GET /api/v1/support/my — Student's tickets
 */
export const getMyTickets = catchAsync(async (req, res) => {
  const tickets = await SupportTicket.find({ student: req.user._id })
    .sort('-createdAt')
    .select('-messages');

  return successResponse(res, 200, 'Your tickets fetched.', tickets);
});

/**
 * GET /api/v1/support/:id — Student (own) or Admin
 */
export const getTicketById = catchAsync(async (req, res, next) => {
  const ticket = await SupportTicket.findById(req.params.id)
    .populate('student', 'name email avatar')
    .populate('messages.sender', 'name avatar role');

  if (!ticket) return next(new AppError('Ticket not found.', 404));

  const isOwner = String(ticket.student._id) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return next(new AppError('You do not have permission to view this ticket.', 403));
  }

  return successResponse(res, 200, 'Ticket fetched.', ticket);
});

/**
 * POST /api/v1/support/:id/reply — Student or Admin
 */
export const replyToTicket = catchAsync(async (req, res, next) => {
  const { message } = req.body;

  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) return next(new AppError('Ticket not found.', 404));

  const isOwner = String(ticket.student) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return next(new AppError('You do not have permission to reply to this ticket.', 403));
  }

  ticket.messages.push({ sender: req.user._id, message });

  // Update status when admin replies
  if (isAdmin && ticket.status === 'open') {
    ticket.status = 'inProgress';
  }

  await ticket.save();

  // Notify the other party
  const notifyUserId = isAdmin ? ticket.student : req.user._id;
  await Notification.create({
    user: notifyUserId,
    type: 'support',
    title: 'New Reply on Support Ticket',
    message: `New reply on ticket: "${ticket.subject}"`,
    data: { ticketId: ticket._id },
  });

  // Send email notification to student if admin replied
  if (isAdmin) {
    try {
      const User = (await import('../models/User.js')).default;
      const student = await User.findById(ticket.student);
      if (student) await sendSupportReply(student, ticket);
    } catch (err) {
      console.error('Support reply email error:', err.message);
    }
  }

  return successResponse(res, 200, 'Reply sent.', ticket);
});

/**
 * PATCH /api/v1/support/:id/status — Admin
 */
export const updateTicketStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;

  if (!['open', 'inProgress', 'resolved', 'closed'].includes(status)) {
    return next(new AppError('Invalid status.', 400));
  }

  const ticket = await SupportTicket.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!ticket) return next(new AppError('Ticket not found.', 404));

  return successResponse(res, 200, 'Ticket status updated.', ticket);
});

/**
 * GET /api/v1/support — Admin: all tickets, paginated
 */
export const getAllTickets = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, status, priority } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const [tickets, total] = await Promise.all([
    SupportTicket.find(filter)
      .populate('student', 'name email avatar')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .select('-messages'),
    SupportTicket.countDocuments(filter),
  ]);

  return successResponse(res, 200, 'Tickets fetched.', tickets, paginationMeta(total, page, limit));
});
