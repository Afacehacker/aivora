import Certificate from '../models/Certificate.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import Notification from '../models/Notification.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import generateCertificateId from '../utils/generateId.js';

/**
 * GET /api/v1/certificates/my — Student's earned certificates
 */
export const getMyCertificates = catchAsync(async (req, res) => {
  const certificates = await Certificate.find({ student: req.user._id })
    .populate({
      path: 'course',
      select: 'title slug thumbnail totalDuration totalLessons instructor',
      populate: { path: 'instructor', select: 'name' },
    })
    .sort('-issuedAt');

  return successResponse(res, 200, 'Certificates fetched.', certificates);
});

/**
 * POST /api/v1/certificates/generate/:courseId — Generate certificate when course is 100% completed
 */
export const generateCertificate = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;

  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
  });

  if (!enrollment) {
    return next(new AppError('You are not enrolled in this course.', 404));
  }

  if (enrollment.progress < 100) {
    return next(new AppError('You must complete 100% of the course to generate a certificate.', 400));
  }

  // Check if certificate already issued
  const existing = await Certificate.findOne({
    student: req.user._id,
    course: courseId,
  }).populate({
    path: 'course',
    select: 'title slug thumbnail totalDuration totalLessons instructor',
    populate: { path: 'instructor', select: 'name' },
  });

  if (existing) {
    return successResponse(res, 200, 'Certificate already issued.', existing);
  }

  const course = await Course.findById(courseId);
  if (!course) return next(new AppError('Course not found.', 404));

  const certificateId = generateCertificateId();

  const certificate = await Certificate.create({
    student: req.user._id,
    course: courseId,
    enrollment: enrollment._id,
    certificateId,
    issuedAt: new Date(),
  });

  enrollment.certificateIssued = true;
  enrollment.certificateUrl = `/certificates/verify/${certificateId}`;
  await enrollment.save();

  await Notification.create({
    user: req.user._id,
    type: 'certificate',
    title: 'Certificate Earned!',
    message: `Congratulations! Your certificate for "${course.title}" is now ready.`,
    data: { courseId, certificateId },
  });

  const populated = await Certificate.findById(certificate._id).populate({
    path: 'course',
    select: 'title slug thumbnail totalDuration totalLessons instructor',
    populate: { path: 'instructor', select: 'name' },
  });

  return successResponse(res, 201, 'Certificate generated successfully.', populated);
});

/**
 * GET /api/v1/certificates/verify/:certificateId — Public verification
 */
export const verifyCertificate = catchAsync(async (req, res, next) => {
  const { certificateId } = req.params;

  const certificate = await Certificate.findOne({ certificateId })
    .populate('student', 'name email avatar')
    .populate({
      path: 'course',
      select: 'title slug thumbnail totalDuration totalLessons level instructor',
      populate: { path: 'instructor', select: 'name' },
    });

  if (!certificate) {
    return next(new AppError('Invalid or non-existent certificate ID.', 404));
  }

  return successResponse(res, 200, 'Certificate verified.', certificate);
});
