import Notification from '../models/Notification.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * GET /api/v1/notifications — Get current user's notifications
 */
export const getMyNotifications = catchAsync(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort('-createdAt')
    .limit(50);

  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
  });

  return successResponse(res, 200, 'Notifications fetched.', {
    notifications,
    unreadCount,
  });
});

/**
 * PATCH /api/v1/notifications/read — Mark one or all as read
 */
export const markAsRead = catchAsync(async (req, res) => {
  const { notificationId } = req.body;

  if (notificationId) {
    await Notification.findOneAndUpdate(
      { _id: notificationId, user: req.user._id },
      { isRead: true }
    );
  } else {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );
  }

  return successResponse(res, 200, 'Notifications marked as read.');
});

/**
 * DELETE /api/v1/notifications/:id — Delete user's own notification
 */
export const deleteNotification = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!notification) return next(new AppError('Notification not found.', 404));

  return successResponse(res, 200, 'Notification deleted.');
});
