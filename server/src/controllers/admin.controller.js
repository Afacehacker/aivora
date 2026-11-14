import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Payment from '../models/Payment.js';
import AdminActivityLog from '../models/AdminActivityLog.js';
import Notification from '../models/Notification.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../middleware/errorHandler.js';
import { successResponse, paginationMeta } from '../utils/apiResponse.js';

/**
 * GET /api/v1/admin/dashboard — Overview stats
 */
export const getDashboardStats = catchAsync(async (req, res) => {
  const [
    totalUsers,
    totalCourses,
    totalEnrollments,
    revenueResult,
    recentEnrollments,
    recentPurchases,
    recentStudents,
    popularCourses,
    pendingReviews,
    openTickets,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Course.countDocuments(),
    Enrollment.countDocuments(),
    Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Enrollment.find()
      .populate('student', 'name email avatar')
      .populate('course', 'title thumbnail')
      .sort('-createdAt')
      .limit(5),
    Payment.find()
      .populate('student', 'name email avatar')
      .populate('course', 'title slug thumbnail')
      .sort('-createdAt')
      .limit(6),
    User.find({ role: 'student' })
      .sort('-createdAt')
      .limit(6),
    Course.find()
      .populate('category', 'name color')
      .sort('-rating.count -createdAt')
      .limit(5),
    (await import('../models/Review.js')).default.countDocuments({ isApproved: false }),
    (await import('../models/SupportTicket.js')).default.countDocuments({ status: 'open' }),
  ]);

  return successResponse(res, 200, 'Dashboard stats fetched.', {
    totalUsers,
    totalStudents: totalUsers,
    totalCourses,
    totalEnrollments,
    totalRevenue: revenueResult[0]?.total || 0,
    recentEnrollments,
    recentPurchases,
    recentStudents,
    popularCourses,
    pendingReviews,
    openTickets,
  });
});

/**
 * GET /api/v1/admin/revenue-chart — Last 12 months revenue
 */
export const getRevenueChart = catchAsync(async (req, res) => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const data = await Payment.aggregate([
    {
      $match: {
        status: 'success',
        createdAt: { $gte: twelveMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  return successResponse(res, 200, 'Revenue chart data fetched.', data);
});

/**
 * GET /api/v1/admin/enrollment-chart — Last 12 months enrollments
 */
export const getEnrollmentChart = catchAsync(async (req, res) => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const data = await Enrollment.aggregate([
    { $match: { createdAt: { $gte: twelveMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  return successResponse(res, 200, 'Enrollment chart data fetched.', data);
});

/**
 * GET /api/v1/admin/students — Paginated, searchable
 */
export const getAllStudents = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, search, isActive } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = { role: 'student' };
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [students, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip(skip).limit(parseInt(limit)),
    User.countDocuments(filter),
  ]);

  return successResponse(res, 200, 'Students fetched.', students, paginationMeta(total, page, limit));
});

/**
 * GET /api/v1/admin/students/:id
 */
export const getStudentById = catchAsync(async (req, res, next) => {
  const student = await User.findById(req.params.id);
  if (!student || student.role !== 'student') {
    return next(new AppError('Student not found.', 404));
  }

  const [enrollments, payments] = await Promise.all([
    Enrollment.find({ student: student._id }).populate('course', 'title slug thumbnail'),
    Payment.find({ student: student._id }).populate('course', 'title').sort('-createdAt'),
  ]);

  return successResponse(res, 200, 'Student details fetched.', { student, enrollments, payments });
});

/**
 * PATCH /api/v1/admin/students/:id/toggle-status
 */
export const toggleStudentStatus = catchAsync(async (req, res, next) => {
  const student = await User.findById(req.params.id);
  if (!student || student.role !== 'student') {
    return next(new AppError('Student not found.', 404));
  }

  student.isActive = req.body.isActive !== undefined ? Boolean(req.body.isActive) : !student.isActive;
  await student.save({ validateBeforeSave: false });

  // Log action
  await AdminActivityLog.create({
    admin: req.user._id,
    action: student.isActive ? 'REACTIVATE_STUDENT' : 'SUSPEND_STUDENT',
    targetModel: 'User',
    targetId: student._id,
    details: { studentEmail: student.email },
    ipAddress: req.ip,
  });

  return successResponse(res, 200, `Student ${student.isActive ? 'reactivated' : 'suspended'}.`, {
    isActive: student.isActive,
  });
});

/**
 * POST /api/v1/admin/students/:id/grant-access
 */
export const grantCourseAccess = catchAsync(async (req, res, next) => {
  const { courseId } = req.body;

  const [student, course] = await Promise.all([
    User.findById(req.params.id),
    Course.findById(courseId),
  ]);

  if (!student || student.role !== 'student') return next(new AppError('Student not found.', 404));
  if (!course) return next(new AppError('Course not found.', 404));

  const existing = await Enrollment.findOne({ student: student._id, course: courseId });
  if (existing) return next(new AppError('Student is already enrolled in this course.', 400));

  const enrollment = await Enrollment.create({
    student: student._id,
    course: courseId,
    payment: null,
  });

  await AdminActivityLog.create({
    admin: req.user._id,
    action: 'GRANT_COURSE_ACCESS',
    targetModel: 'Enrollment',
    targetId: enrollment._id,
    details: { studentId: student._id, courseId, courseTitle: course.title },
    ipAddress: req.ip,
  });

  await Notification.create({
    user: student._id,
    type: 'enrollment',
    title: 'Course Access Granted',
    message: `Admin has granted you access to "${course.title}".`,
    data: { courseId },
  });

  return successResponse(res, 201, 'Course access granted.', enrollment);
});

/**
 * DELETE /api/v1/admin/students/:id/revoke-access
 */
export const revokeCourseAccess = catchAsync(async (req, res, next) => {
  const { courseId } = req.body;

  const enrollment = await Enrollment.findOneAndDelete({
    student: req.params.id,
    course: courseId,
  });

  if (!enrollment) return next(new AppError('Enrollment not found.', 404));

  await AdminActivityLog.create({
    admin: req.user._id,
    action: 'REVOKE_COURSE_ACCESS',
    targetModel: 'Enrollment',
    targetId: enrollment._id,
    details: { studentId: req.params.id, courseId },
    ipAddress: req.ip,
  });

  return successResponse(res, 200, 'Course access revoked.');
});

/**
 * GET /api/v1/admin/activity-logs
 */
export const getActivityLogs = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [logs, total] = await Promise.all([
    AdminActivityLog.find()
      .populate('admin', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit)),
    AdminActivityLog.countDocuments(),
  ]);

  return successResponse(res, 200, 'Activity logs fetched.', logs, paginationMeta(total, page, limit));
});
