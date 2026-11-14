import Lesson from '../models/Lesson.js';
import Module from '../models/Module.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/apiResponse.js';

// Helper to check if student is enrolled
const checkEnrolled = async (userId, courseId) =>
  Enrollment.findOne({ student: userId, course: courseId });

/**
 * GET /api/v1/lessons/course/:courseId
 */
export const getLessonsByCourse = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return next(new AppError('Course not found.', 404));

  const isAdmin = req.user.role === 'admin';
  const enrolled = isAdmin ? true : await checkEnrolled(req.user._id, course._id);

  const lessons = await Lesson.find({ course: req.params.courseId })
    .populate('module', 'title order')
    .sort({ order: 1 });

  // Redact video URLs for non-enrolled, non-preview lessons
  const sanitized = lessons.map((lesson) => {
    const obj = lesson.toObject();
    if (!isAdmin && !enrolled && !lesson.isPreview) {
      obj.videoUrl = null;
      obj.content = null;
    }
    return obj;
  });

  return successResponse(res, 200, 'Lessons fetched.', sanitized);
});

/**
 * GET /api/v1/lessons/:id
 */
export const getLesson = catchAsync(async (req, res, next) => {
  const lesson = await Lesson.findById(req.params.id).populate('module', 'title order');
  if (!lesson) return next(new AppError('Lesson not found.', 404));

  const isAdmin = req.user.role === 'admin';

  if (!isAdmin && !lesson.isPreview) {
    const enrolled = await checkEnrolled(req.user._id, lesson.course);
    if (!enrolled) return next(new AppError('You must be enrolled to access this lesson.', 403));
  }

  return successResponse(res, 200, 'Lesson fetched.', lesson);
});

/**
 * POST /api/v1/lessons — Admin only
 */
export const createLesson = catchAsync(async (req, res, next) => {
  const moduleId = req.body.moduleId || req.params.moduleId;
  let courseId = req.body.courseId;
  const {
    title, description, videoUrl, videoDuration,
    order, type, isPreview, content, resources,
  } = req.body;

  if (!moduleId) return next(new AppError('Module ID is required.', 400));
  if (!title) return next(new AppError('Lesson title is required.', 400));

  const module = await Module.findById(moduleId);
  if (!module) return next(new AppError('Module not found.', 404));
  if (!courseId) courseId = module.course;

  const course = await Course.findById(courseId);
  if (!course) return next(new AppError('Course not found.', 404));

  // Handle video upload if file provided
  let finalVideoUrl = videoUrl;
  let videoPublicId = null;
  let finalThumbnail = null;

  if (req.file) {
    finalVideoUrl = req.file.path;
    videoPublicId = req.file.filename;
  }

  const lesson = await Lesson.create({
    module: moduleId,
    course: courseId,
    title,
    description,
    videoUrl: finalVideoUrl,
    videoPublicId,
    videoDuration: videoDuration || 0,
    thumbnail: finalThumbnail,
    order: order || 0,
    type: type || 'video',
    isPreview: isPreview || false,
    content: content || '',
    resources: resources || [],
  });

  // Update course totalLessons count and auto-fill previewVideo if empty
  const courseUpdate = { $inc: { totalLessons: 1 } };
  if (!course.previewVideo && finalVideoUrl) {
    courseUpdate.$set = { previewVideo: finalVideoUrl };
  }
  await Course.findByIdAndUpdate(courseId, courseUpdate);

  return successResponse(res, 201, 'Lesson created successfully.', lesson);
});

/**
 * PATCH /api/v1/lessons/:id — Admin only
 */
export const updateLesson = catchAsync(async (req, res, next) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) return next(new AppError('Lesson not found.', 404));

  const allowedFields = [
    'title', 'description', 'videoUrl', 'videoDuration', 'order',
    'type', 'isPreview', 'isPublished', 'content', 'resources',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) lesson[field] = req.body[field];
  });

  if (req.file) {
    lesson.videoUrl = req.file.path;
    lesson.videoPublicId = req.file.filename;
  }

  await lesson.save();
  return successResponse(res, 200, 'Lesson updated successfully.', lesson);
});

/**
 * DELETE /api/v1/lessons/:id — Admin only
 */
export const deleteLesson = catchAsync(async (req, res, next) => {
  const lesson = await Lesson.findByIdAndDelete(req.params.id);
  if (!lesson) return next(new AppError('Lesson not found.', 404));

  // Decrement course totalLessons count
  await Course.findByIdAndUpdate(lesson.course, { $inc: { totalLessons: -1 } });

  return successResponse(res, 200, 'Lesson deleted successfully.');
});

/**
 * PATCH /api/v1/lessons/module/:moduleId/reorder — Admin only
 */
export const reorderLessons = catchAsync(async (req, res, next) => {
  const { order } = req.body;

  if (!Array.isArray(order)) return next(new AppError('order must be an array.', 400));

  const updateOps = order.map(({ id, order: newOrder }) =>
    Lesson.findByIdAndUpdate(id, { order: newOrder })
  );

  await Promise.all(updateOps);
  return successResponse(res, 200, 'Lessons reordered successfully.');
});
