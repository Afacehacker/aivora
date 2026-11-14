import Enrollment from '../models/Enrollment.js';
import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * GET /api/v1/enrollments/my — Student: get all enrolled courses
 */
export const getMyEnrollments = catchAsync(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id })
    .populate({
      path: 'course',
      populate: { path: 'category', select: 'name slug color' },
      select: 'title slug thumbnail previewVideo shortDescription totalLessons totalDuration level',
    })
    .sort('-createdAt');

  return successResponse(res, 200, 'Enrollments fetched.', enrollments);
});

/**
 * GET /api/v1/enrollments/check/:courseId — Check if student is enrolled
 */
export const checkEnrollment = catchAsync(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.courseId,
  });

  return successResponse(res, 200, 'Enrollment status checked.', {
    isEnrolled: !!enrollment,
    enrollment: enrollment || null,
  });
});

/**
 * PATCH /api/v1/enrollments/progress or /api/v1/progress/:lessonId — Mark lesson complete, update progress
 */
export const updateProgress = catchAsync(async (req, res, next) => {
  const lessonId = req.body.lessonId || req.params.lessonId;
  let courseId = req.body.courseId;

  if (!lessonId) {
    return next(new AppError('lessonId is required.', 400));
  }

  if (!courseId) {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return next(new AppError('Lesson not found.', 404));
    courseId = lesson.course;
  }

  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
  });

  if (!enrollment) return next(new AppError('You are not enrolled in this course.', 404));

  // Add lesson to completedLessons if not already there
  if (!enrollment.completedLessons.map(String).includes(String(lessonId))) {
    enrollment.completedLessons.push(lessonId);
  }

  enrollment.lastAccessedLesson = lessonId;

  // Calculate progress
  const totalLessons = await Lesson.countDocuments({ course: courseId, isPublished: true });
  if (totalLessons > 0) {
    enrollment.progress = Math.round((enrollment.completedLessons.length / totalLessons) * 100);
  }

  // Mark as completed if 100%
  if (enrollment.progress === 100 && !enrollment.completedAt) {
    enrollment.completedAt = new Date();
  }

  await enrollment.save();
  return successResponse(res, 200, 'Progress updated.', {
    progress: enrollment.progress,
    completedLessons: enrollment.completedLessons,
    completedCount: enrollment.completedLessons.length,
    totalLessons,
    completedAt: enrollment.completedAt,
    enrollment,
  });
});

/**
 * GET /api/v1/enrollments/last-watched/:courseId or /api/v1/progress/:courseId
 */
export const getLastWatched = catchAsync(async (req, res, next) => {
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.courseId,
  }).populate('lastAccessedLesson', 'title order module');

  if (!enrollment) return next(new AppError('You are not enrolled in this course.', 404));

  return successResponse(res, 200, 'Course progress fetched.', {
    lastAccessedLesson: enrollment.lastAccessedLesson,
    progress: enrollment.progress,
    completedLessons: enrollment.completedLessons,
    completedAt: enrollment.completedAt,
    enrollment,
  });
});
