import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import Payment from '../models/Payment.js';
import Review from '../models/Review.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../middleware/errorHandler.js';
import { successResponse, paginationMeta } from '../utils/apiResponse.js';
import generateSlug from '../utils/generateSlug.js';
import { deleteFile } from '../services/cloudinary.service.js';

/**
 * GET /api/v1/courses — Public, with pagination, filtering, sorting
 */
export const getAllCourses = catchAsync(async (req, res) => {
  const { page = 1, limit = 12, category, level, search, sort = '-createdAt', featured, all } = req.query;

  const filter = {};
  if (all !== 'true') {
    filter.isPublished = true;
  }

  if (category) {
    // Support both ObjectId and category slug
    if (category.match(/^[0-9a-fA-F]{24}$/)) {
      filter.category = category;
    } else {
      const Category = (await import('../models/Category.js')).default;
      const catDoc = await Category.findOne({ slug: category });
      if (catDoc) filter.category = catDoc._id;
    }
  }
  if (level && level !== 'all') filter.level = level.toLowerCase();
  if (featured === 'true') filter.isFeatured = true;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { shortDescription: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .populate('category', 'name slug color icon')
      .populate('instructor', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v'),
    Course.countDocuments(filter),
  ]);

  return successResponse(res, 200, 'Courses fetched.', courses, paginationMeta(total, page, limit));
});

/**
 * GET /api/v1/courses/featured — Public
 */
export const getFeaturedCourses = catchAsync(async (req, res) => {
  const courses = await Course.find({ isPublished: true, isFeatured: true })
    .populate('category', 'name slug color icon')
    .populate('instructor', 'name avatar')
    .limit(6)
    .sort('-createdAt');

  return successResponse(res, 200, 'Featured courses fetched.', courses);
});

/**
 * GET /api/v1/courses/:slug — Public (supports slug or ObjectId)
 */
export const getCourseBySlug = catchAsync(async (req, res, next) => {
  const param = req.params.slug || req.params.id;
  const query = param.match(/^[0-9a-fA-F]{24}$/)
    ? { $or: [{ _id: param }, { slug: param }] }
    : { slug: param };

  const course = await Course.findOne(query)
    .populate('category', 'name slug color icon')
    .populate('instructor', 'name avatar bio');

  if (!course) return next(new AppError('Course not found.', 404));

  // Count enrolled students and fetch curriculum (modules + lessons metadata)
  const [enrolledCount, modules, lessons] = await Promise.all([
    Enrollment.countDocuments({ course: course._id }),
    Module.find({ course: course._id }).sort({ order: 1 }),
    Lesson.find({ course: course._id }).sort({ order: 1 }),
  ]);

  // Attach lessons to each module (redact non-preview video URLs for public)
  const modulesWithLessons = modules.map((mod) => {
    const modObj = mod.toObject();
    modObj.lessons = lessons
      .filter((l) => String(l.module) === String(mod._id))
      .map((l) => {
        const lObj = l.toObject();
        if (!lObj.isPreview) {
          lObj.videoUrl = null;
        }
        return lObj;
      });
    return modObj;
  });

  // Fallback previewVideo to first available lesson video if previewVideo wasn't explicitly set
  const courseObj = course.toObject();
  if (!courseObj.previewVideo) {
    const firstVideoLesson = lessons.find((l) => l.videoUrl);
    if (firstVideoLesson) {
      courseObj.previewVideo = firstVideoLesson.videoUrl;
    }
  }

  return successResponse(res, 200, 'Course fetched.', {
    ...courseObj,
    enrolledCount,
    modules: modulesWithLessons,
  });
});

/**
 * POST /api/v1/courses — Admin only
 */
export const createCourse = catchAsync(async (req, res, next) => {
  const { title, description, shortDescription, category, price, discountPrice, discountExpiry,
    level, language, tags, requirements, objectives, targetAudience, thumbnail, previewVideo, isFeatured, isPublished, modules } = req.body;

  let slug = generateSlug(title);

  // Ensure unique slug
  const existingSlug = await Course.findOne({ slug });
  if (existingSlug) {
    slug = `${slug}-${Date.now()}`;
  }

  let totalLessons = 0;
  let totalDuration = 0;
  let firstLessonVideo = null;

  if (Array.isArray(modules)) {
    modules.forEach((m) => {
      if (Array.isArray(m.lessons)) {
        m.lessons.forEach((l) => {
          totalLessons += 1;
          totalDuration += Number(l.videoDuration) || 0;
          if (!firstLessonVideo && l.videoUrl) {
            firstLessonVideo = l.videoUrl;
          }
        });
      }
    });
  }

  const course = await Course.create({
    title,
    slug,
    description,
    shortDescription,
    category,
    instructor: req.user._id,
    price,
    discountPrice,
    discountExpiry,
    level,
    language,
    thumbnail: thumbnail || null,
    previewVideo: previewVideo || firstLessonVideo || null,
    totalLessons,
    totalDuration,
    isFeatured: isFeatured || false,
    isPublished: isPublished !== undefined ? isPublished : true,
    status: isPublished !== false ? 'published' : 'draft',
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
    requirements: requirements ? (Array.isArray(requirements) ? requirements : [requirements]) : [],
    objectives: objectives ? (Array.isArray(objectives) ? objectives : [objectives]) : [],
    targetAudience: targetAudience ? (Array.isArray(targetAudience) ? targetAudience : [targetAudience]) : [],
  });

  // If initial modules & lessons were staged before posting, create them now
  if (Array.isArray(modules) && modules.length > 0) {
    for (let i = 0; i < modules.length; i++) {
      const mData = modules[i];
      if (!mData.title) continue;
      const modDoc = await Module.create({
        course: course._id,
        title: mData.title,
        description: mData.description || '',
        order: mData.order ?? i + 1,
        isPublished: true,
      });

      if (Array.isArray(mData.lessons)) {
        for (let j = 0; j < mData.lessons.length; j++) {
          const lData = mData.lessons[j];
          if (!lData.title) continue;
          await Lesson.create({
            module: modDoc._id,
            course: course._id,
            title: lData.title,
            description: lData.description || '',
            videoUrl: lData.videoUrl || null,
            videoDuration: Number(lData.videoDuration) || 600,
            order: lData.order ?? j + 1,
            type: lData.type || 'video',
            isPreview: Boolean(lData.isPreview),
            isPublished: true,
            resources: Array.isArray(lData.resources) ? lData.resources : [],
          });
        }
      }
    }
  }

  return successResponse(res, 201, 'Course created successfully.', course);
});

/**
 * PATCH /api/v1/courses/:id — Admin only
 */
export const updateCourse = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) return next(new AppError('Course not found.', 404));

  const allowedFields = [
    'title', 'description', 'shortDescription', 'category', 'price', 'discountPrice',
    'discountExpiry', 'level', 'language', 'tags', 'requirements', 'objectives',
    'targetAudience', 'thumbnail', 'previewVideo', 'isFeatured', 'isPublished', 'status',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) course[field] = req.body[field];
  });

  if (req.body.title && req.body.title !== course.title) {
    course.slug = generateSlug(req.body.title);
  }

  await course.save();
  return successResponse(res, 200, 'Course updated successfully.', course);
});

/**
 * DELETE /api/v1/courses/:id — Admin only
 */
export const deleteCourse = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) return next(new AppError('Course not found.', 404));

  // Delete thumbnail from cloudinary if exists
  if (course.thumbnail) {
    try {
      // Extract public id from URL
      const parts = course.thumbnail.split('/');
      const publicId = parts.slice(-2).join('/').replace(/\.[^.]+$/, '');
      await deleteFile(publicId);
    } catch (err) {
      console.error('Cloudinary delete error:', err.message);
    }
  }

  await course.deleteOne();
  return successResponse(res, 200, 'Course deleted successfully.');
});

/**
 * PATCH /api/v1/courses/:id/publish — Admin only
 */
export const togglePublish = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) return next(new AppError('Course not found.', 404));

  course.isPublished = !course.isPublished;
  course.status = course.isPublished ? 'published' : 'draft';
  await course.save();

  return successResponse(res, 200, `Course ${course.isPublished ? 'published' : 'unpublished'} successfully.`, {
    isPublished: course.isPublished,
    status: course.status,
  });
});

/**
 * PATCH /api/v1/courses/:id/thumbnail — Admin only
 */
export const uploadThumbnail = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('Please upload an image file.', 400));

  const course = await Course.findById(req.params.id);
  if (!course) return next(new AppError('Course not found.', 404));

  // Delete old thumbnail if exists
  if (course.thumbnail) {
    try {
      const parts = course.thumbnail.split('/');
      const publicId = parts.slice(-2).join('/').replace(/\.[^.]+$/, '');
      await deleteFile(publicId);
    } catch (err) {
      console.error('Cloudinary delete error:', err.message);
    }
  }

  course.thumbnail = req.file.path;
  await course.save();

  return successResponse(res, 200, 'Thumbnail uploaded successfully.', { thumbnail: course.thumbnail });
});

/**
 * GET /api/v1/courses/:id/stats — Admin only
 */
export const getCourseStats = catchAsync(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) return next(new AppError('Course not found.', 404));

  const [enrollmentCount, revenue, reviewStats] = await Promise.all([
    Enrollment.countDocuments({ course: course._id }),
    Payment.aggregate([
      { $match: { course: course._id, status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Review.aggregate([
      { $match: { course: course._id, isApproved: true } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]),
  ]);

  const stats = {
    enrollments: enrollmentCount,
    revenue: revenue[0]?.total || 0,
    rating: {
      avg: reviewStats[0]?.avg || 0,
      count: reviewStats[0]?.count || 0,
    },
  };

  return successResponse(res, 200, 'Course stats fetched.', stats);
});
