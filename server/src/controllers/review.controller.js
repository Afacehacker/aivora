import Review from '../models/Review.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../middleware/errorHandler.js';
import { successResponse, paginationMeta } from '../utils/apiResponse.js';

// Recalculate course rating average
const updateCourseRating = async (courseId) => {
  const stats = await Review.aggregate([
    { $match: { course: courseId, isApproved: true } },
    { $group: { _id: '$course', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const rating = stats[0]
    ? { avg: Math.round(stats[0].avg * 10) / 10, count: stats[0].count }
    : { avg: 0, count: 0 };

  await Course.findByIdAndUpdate(courseId, { rating });
};

/**
 * POST /api/v1/reviews or /api/v1/reviews/:courseId — Enrolled student only
 */
export const createReview = catchAsync(async (req, res, next) => {
  const { rating, comment } = req.body;
  const courseId = req.params.courseId || req.body.courseId;
  if (!courseId) return next(new AppError('Course ID is required.', 400));

  // Check enrollment
  const enrolled = await Enrollment.findOne({ student: req.user._id, course: courseId });
  if (!enrolled) return next(new AppError('You must be enrolled to review this course.', 403));

  // Check for duplicate review
  const existing = await Review.findOne({ student: req.user._id, course: courseId });
  if (existing) return next(new AppError('You have already reviewed this course.', 400));

  const review = await Review.create({
    student: req.user._id,
    course: courseId,
    rating,
    comment,
  });

  await updateCourseRating(courseId);

  return successResponse(res, 201, 'Review submitted. It will be visible after approval.', review);
});

/**
 * GET /api/v1/reviews/course/:courseId — Public (approved only)
 */
export const getCourseReviews = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = { course: req.params.courseId, isApproved: true };
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('student', 'name avatar')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit)),
    Review.countDocuments(filter),
  ]);

  return successResponse(res, 200, 'Reviews fetched.', reviews, paginationMeta(total, page, limit));
});

/**
 * PATCH /api/v1/reviews/:id/approve or /status — Admin only
 */
export const approveReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('Review not found.', 404));

  if (req.body.isApproved !== undefined) {
    review.isApproved = Boolean(req.body.isApproved);
  } else if (req.body.status !== undefined) {
    review.isApproved = req.body.status === 'approved' || req.body.status === true;
  } else {
    review.isApproved = true;
  }

  await review.save();
  await updateCourseRating(review.course);

  return successResponse(res, 200, 'Review status updated.', review);
});

/**
 * DELETE /api/v1/reviews/:id — Admin or review owner
 */
export const deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('Review not found.', 404));

  const isOwner = String(review.student) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return next(new AppError('You do not have permission to delete this review.', 403));
  }

  const courseId = review.course;
  await review.deleteOne();
  await updateCourseRating(courseId);

  return successResponse(res, 200, 'Review deleted successfully.');
});

/**
 * GET /api/v1/reviews — Admin: all reviews with approval status
 */
export const getAllReviews = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, isApproved } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = {};
  if (isApproved !== undefined) filter.isApproved = isApproved === 'true';

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('student', 'name email avatar')
      .populate('course', 'title slug')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit)),
    Review.countDocuments(filter),
  ]);

  return successResponse(res, 200, 'Reviews fetched.', reviews, paginationMeta(total, page, limit));
});
