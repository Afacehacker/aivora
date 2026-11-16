import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import Payment from '../models/Payment.js';
import Review from '../models/Review.js';
import SiteSettings from '../models/SiteSettings.js';
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
 * Helper to recalculate and persist course totalLessons and totalDuration
 */
export const recalculateCourseStats = async (courseId) => {
  const lessons = await Lesson.find({ course: courseId });
  const totalLessons = lessons.length;
  const totalDuration = lessons.reduce((sum, l) => sum + (Number(l.videoDuration) || 0), 0);
  await Course.findByIdAndUpdate(courseId, { totalLessons, totalDuration });
  return { totalLessons, totalDuration };
};

/**
 * GET /api/v1/courses/:slug — Public (supports slug or ObjectId), with access control
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

  // Determine access privileges: admin or enrolled user has paid/full access
  const isAdmin = req.user?.role === 'admin';
  let isEnrolled = false;
  if (req.user && !isAdmin) {
    const enr = await Enrollment.findOne({ student: req.user._id, course: course._id });
    isEnrolled = Boolean(enr);
  }

  // Count enrolled students and fetch curriculum (modules + lessons metadata)
  const [enrolledCount, modules, lessons] = await Promise.all([
    Enrollment.countDocuments({ course: course._id }),
    Module.find({ course: course._id }).sort({ order: 1 }),
    Lesson.find({ course: course._id }).sort({ order: 1 }),
  ]);

  // Attach lessons to each module (redact non-preview video URLs if user has not paid / enrolled)
  const modulesWithLessons = modules.map((mod) => {
    const modObj = mod.toObject();
    modObj.lessons = lessons
      .filter((l) => String(l.module) === String(mod._id))
      .map((l) => {
        const lObj = l.toObject();
        // A user only gets access to the video tutorial after making payment, unless marked as free sample preview
        if (!isAdmin && !isEnrolled && !lObj.isPreview) {
          lObj.videoUrl = null;
          lObj.content = null;
        }
        return lObj;
      });
    return modObj;
  });

  // Fallback previewVideo to first available preview or tutorial video if previewVideo wasn't explicitly set
  const courseObj = course.toObject();
  if (!courseObj.previewVideo) {
    const firstVideoLesson = lessons.find((l) => l.isPreview && l.videoUrl) || lessons.find((l) => l.videoUrl);
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
  const {
    title, description, shortDescription, category, price, discountPrice, discountExpiry,
    level, language, tags, requirements, objectives, targetAudience, thumbnail, previewVideo,
    isFeatured, isPublished, modules, tutorials,
  } = req.body;

  let slug = generateSlug(title);

  // Ensure unique slug
  const existingSlug = await Course.findOne({ slug });
  if (existingSlug) {
    slug = `${slug}-${Date.now()}`;
  }

  // Support direct tutorial video array or modules structure
  let tutorialList = [];
  if (Array.isArray(tutorials) && tutorials.length > 0) {
    tutorialList = tutorials;
  } else if (Array.isArray(modules) && modules.length > 0) {
    modules.forEach((m) => {
      if (Array.isArray(m.lessons)) {
        tutorialList.push(...m.lessons);
      }
    });
  }

  let totalLessons = tutorialList.length;
  let totalDuration = tutorialList.reduce((acc, t) => acc + (Number(t.videoDuration) || 0), 0);
  let firstLessonVideo = null;
  const firstVideoObj = tutorialList.find((t) => t.videoUrl);
  if (firstVideoObj) firstLessonVideo = firstVideoObj.videoUrl;

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

  // If tutorials were provided directly from admin upload
  if (Array.isArray(tutorials) && tutorials.length > 0) {
    const modDoc = await Module.create({
      course: course._id,
      title: 'Course Video Tutorials',
      description: 'Step-by-step video tutorials included in this course.',
      order: 1,
      isPublished: true,
    });

    for (let j = 0; j < tutorials.length; j++) {
      const tData = tutorials[j];
      if (!tData.title) continue;
      await Lesson.create({
        module: modDoc._id,
        course: course._id,
        title: tData.title,
        description: tData.description || '',
        videoUrl: tData.videoUrl || null,
        videoDuration: Number(tData.videoDuration) || 0,
        order: tData.order ?? j + 1,
        type: 'video',
        isPreview: Boolean(tData.isPreview),
        isPublished: true,
        resources: Array.isArray(tData.resources) ? tData.resources : [],
      });
    }
  } else if (Array.isArray(modules) && modules.length > 0) {
    // If structured modules & lessons were provided
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
            videoDuration: Number(lData.videoDuration) || 0,
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

  await recalculateCourseStats(course._id);

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

  // If tutorials array is passed, synchronize the course's video tutorials
  if (Array.isArray(req.body.tutorials)) {
    const tutorials = req.body.tutorials;
    let modDoc = await Module.findOne({ course: course._id }).sort({ order: 1 });
    if (!modDoc) {
      modDoc = await Module.create({
        course: course._id,
        title: 'Course Video Tutorials',
        description: 'Step-by-step video tutorials included in this course.',
        order: 1,
        isPublished: true,
      });
    }

    await Lesson.deleteMany({ course: course._id });

    let totalDuration = 0;
    for (let j = 0; j < tutorials.length; j++) {
      const t = tutorials[j];
      if (!t.title) continue;
      const dur = Number(t.videoDuration) || 0;
      totalDuration += dur;
      await Lesson.create({
        module: modDoc._id,
        course: course._id,
        title: t.title,
        description: t.description || '',
        videoUrl: t.videoUrl || null,
        videoDuration: dur,
        order: t.order ?? j + 1,
        type: 'video',
        isPreview: Boolean(t.isPreview),
        isPublished: true,
        resources: Array.isArray(t.resources) ? t.resources : [],
      });
    }

    course.totalLessons = tutorials.length;
    course.totalDuration = totalDuration;
    if (!course.previewVideo) {
      const previewTut = tutorials.find((t) => t.isPreview && t.videoUrl) || tutorials.find((t) => t.videoUrl);
      if (previewTut) course.previewVideo = previewTut.videoUrl;
    }
  }

  await course.save();
  await recalculateCourseStats(course._id);

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

  // Delete preview video from cloudinary if exists
  if (course.previewVideo && course.previewVideo.includes('res.cloudinary.com')) {
    try {
      const parts = course.previewVideo.split('/');
      const publicId = parts.slice(-2).join('/').replace(/\.[^.]+$/, '');
      await deleteFile(publicId);
    } catch (err) {
      console.error('Cloudinary preview video delete error:', err.message);
    }
  }

  // Cascade delete all modules, lessons, and reviews attached to this course
  await Module.deleteMany({ course: course._id });
  await Lesson.deleteMany({ course: course._id });
  await Review.deleteMany({ course: course._id });
  await SiteSettings.updateMany({}, { $pull: { featuredCourses: course._id } });

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
