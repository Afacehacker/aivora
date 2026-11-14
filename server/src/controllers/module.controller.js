import Module from '../models/Module.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * GET /api/v1/modules/course/:courseId
 */
export const getModulesByCourse = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return next(new AppError('Course not found.', 404));

  // Check enrollment if not admin
  if (req.user.role !== 'admin') {
    const enrolled = await Enrollment.findOne({ student: req.user._id, course: course._id });
    if (!enrolled) return next(new AppError('You are not enrolled in this course.', 403));
  }

  const modules = await Module.find({ course: req.params.courseId }).sort({ order: 1 });
  return successResponse(res, 200, 'Modules fetched.', modules);
});

/**
 * POST /api/v1/modules — Admin only
 */
export const createModule = catchAsync(async (req, res, next) => {
  const courseId = req.body.courseId || req.params.courseId;
  const { title, description, order } = req.body;

  if (!courseId) return next(new AppError('Course ID is required.', 400));
  if (!title) return next(new AppError('Module title is required.', 400));

  const course = await Course.findById(courseId);
  if (!course) return next(new AppError('Course not found.', 404));

  const module = await Module.create({ course: courseId, title, description, order });
  return successResponse(res, 201, 'Module created successfully.', module);
});

/**
 * PATCH /api/v1/modules/:id — Admin only
 */
export const updateModule = catchAsync(async (req, res, next) => {
  const module = await Module.findById(req.params.id);
  if (!module) return next(new AppError('Module not found.', 404));

  const { title, description, order, isPublished } = req.body;

  if (title !== undefined) module.title = title;
  if (description !== undefined) module.description = description;
  if (order !== undefined) module.order = order;
  if (isPublished !== undefined) module.isPublished = isPublished;

  await module.save();
  return successResponse(res, 200, 'Module updated successfully.', module);
});

/**
 * DELETE /api/v1/modules/:id — Admin only
 */
export const deleteModule = catchAsync(async (req, res, next) => {
  const module = await Module.findByIdAndDelete(req.params.id);
  if (!module) return next(new AppError('Module not found.', 404));
  return successResponse(res, 200, 'Module deleted successfully.');
});

/**
 * PATCH /api/v1/modules/course/:courseId/reorder — Admin only
 */
export const reorderModules = catchAsync(async (req, res, next) => {
  const { order } = req.body; // Array of { id, order }

  if (!Array.isArray(order)) return next(new AppError('order must be an array.', 400));

  const updateOps = order.map(({ id, order: newOrder }) =>
    Module.findByIdAndUpdate(id, { order: newOrder })
  );

  await Promise.all(updateOps);
  return successResponse(res, 200, 'Modules reordered successfully.');
});
