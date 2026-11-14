import Payment from '../models/Payment.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import Order from '../models/Order.js';
import Coupon from '../models/Coupon.js';
import Notification from '../models/Notification.js';
import SiteSettings from '../models/SiteSettings.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../middleware/errorHandler.js';
import { successResponse, paginationMeta } from '../utils/apiResponse.js';
import { generatePaymentReference } from '../services/payment.service.js';
import {
  sendPaymentConfirmation,
  sendEnrollmentConfirmation,
} from '../services/email.service.js';

// Helper: Enroll student after manual payment approval or free enrollment
const enrollStudent = async (studentId, courseId, paymentId) => {
  const existing = await Enrollment.findOne({ student: studentId, course: courseId });
  if (existing) return existing;

  const enrollment = await Enrollment.create({
    student: studentId,
    course: courseId,
    payment: paymentId,
  });

  // Create notification
  await Notification.create({
    user: studentId,
    type: 'enrollment',
    title: 'Course Access Granted!',
    message: 'Your payment has been confirmed and you now have full access to your course. Start learning now!',
    data: { courseId, enrollmentId: enrollment._id },
  });

  return enrollment;
};

/**
 * GET /api/v1/payments/accounts — Public/Student endpoint to fetch active bank transfer accounts & OPay notice
 */
export const getManualPaymentDetails = catchAsync(async (req, res) => {
  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = await SiteSettings.create({});
  }

  const activeAccounts = (settings.paymentAccounts || []).filter((acc) => acc.isActive !== false);

  return successResponse(res, 200, 'Manual payment details fetched.', {
    paymentAccounts: activeAccounts,
    paymentNotice:
      settings.paymentNotice ||
      'Payments cannot be received from OPay because transfers from OPay are currently facing gateway problems. However, we accept payments from any other Nigerian bank such as PalmPay, Kuda, Moniepoint, UBA, Access Bank, FirstBank, or any other Nigerian bank (not OPay).',
  });
});

/**
 * POST /api/v1/payments/initialize — Submit Manual Bank Transfer Payment
 */
export const initializePayment = catchAsync(async (req, res, next) => {
  const {
    courseId,
    couponCode,
    senderName = '',
    senderBank = '',
    recipientBank = '',
    recipientAccountNumber = '',
    transferNote = '',
    proofUrl = null,
  } = req.body;

  // Reject OPay transfers explicitly
  if (senderBank && senderBank.toLowerCase().includes('opay')) {
    return next(
      new AppError(
        'Payments from OPay cannot be received due to gateway problems. Please transfer from another Nigerian bank such as PalmPay, Kuda, Moniepoint, UBA, Access Bank, FirstBank, or any other Nigerian bank.',
        400
      )
    );
  }

  const course = await Course.findById(courseId);
  if (!course) return next(new AppError('Course not found.', 404));
  if (!course.isPublished) return next(new AppError('This course is not available.', 400));

  // Check if already enrolled
  const alreadyEnrolled = await Enrollment.findOne({ student: req.user._id, course: courseId });
  if (alreadyEnrolled) return next(new AppError('You are already enrolled in this course.', 400));

  let amount = course.price;

  // Apply discount if active
  if (
    course.discountPrice !== null &&
    course.discountPrice !== undefined &&
    course.discountPrice < course.price &&
    (!course.discountExpiry || new Date(course.discountExpiry) > new Date())
  ) {
    amount = course.discountPrice;
  }

  let discountApplied = 0;
  let couponDoc = null;

  // Apply coupon if provided
  if (couponCode) {
    couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (!couponDoc) return next(new AppError('Invalid or expired coupon code.', 400));
    if (couponDoc.expiresAt && new Date(couponDoc.expiresAt) < new Date()) {
      return next(new AppError('This coupon has expired.', 400));
    }
    if (couponDoc.maxUses && couponDoc.usedCount >= couponDoc.maxUses) {
      return next(new AppError('This coupon has reached its usage limit.', 400));
    }
    if (amount < couponDoc.minOrderAmount) {
      return next(new AppError(`Minimum order amount for this coupon is ${couponDoc.minOrderAmount}.`, 400));
    }
    if (
      couponDoc.applicableCourses.length &&
      !couponDoc.applicableCourses.map(String).includes(String(courseId))
    ) {
      return next(new AppError('This coupon is not applicable to this course.', 400));
    }

    if (couponDoc.type === 'percentage') {
      discountApplied = Math.round(amount * (couponDoc.value / 100));
    } else {
      discountApplied = Math.min(couponDoc.value, amount);
    }
    amount = Math.max(amount - discountApplied, 0);
  }

  // If course is free after discount, enroll directly
  if (amount === 0) {
    const payment = await Payment.create({
      student: req.user._id,
      course: courseId,
      amount: 0,
      currency: 'NGN',
      paymentProvider: 'manual',
      transactionRef: generatePaymentReference(),
      status: 'success',
      webhookVerified: true,
    });

    await enrollStudent(req.user._id, courseId, payment._id);

    if (couponDoc) {
      couponDoc.usedCount += 1;
      await couponDoc.save();
    }

    return successResponse(res, 200, 'Enrolled successfully (free course).', { enrolled: true });
  }

  if (!senderName.trim() || !senderBank.trim()) {
    return next(
      new AppError('Please provide the Sender Account Name and the Nigerian Bank you transferred from.', 400)
    );
  }

  const ref = generatePaymentReference();

  // Create pending manual payment record
  const payment = await Payment.create({
    student: req.user._id,
    course: courseId,
    amount,
    currency: 'NGN',
    paymentProvider: 'manual',
    transactionRef: ref,
    senderName: senderName.trim(),
    senderBank: senderBank.trim(),
    recipientBank: recipientBank.trim(),
    recipientAccountNumber: recipientAccountNumber.trim(),
    transferNote: transferNote.trim(),
    proofUrl,
    status: 'pending',
    metadata: {
      courseTitle: course.title,
      couponCode: couponCode || null,
      senderName: senderName.trim(),
      senderBank: senderBank.trim(),
      recipientBank: recipientBank.trim(),
      recipientAccountNumber: recipientAccountNumber.trim(),
      transferNote: transferNote.trim(),
    },
  });

  // Create order
  await Order.create({
    student: req.user._id,
    course: courseId,
    payment: payment._id,
    amount,
    discountApplied,
    coupon: couponDoc?._id || null,
    status: 'pending',
  });

  if (couponDoc) {
    couponDoc.usedCount += 1;
    await couponDoc.save();
  }

  // Notify student that manual payment was received and is awaiting admin confirmation
  await Notification.create({
    user: req.user._id,
    type: 'payment',
    title: 'Manual Payment Submitted',
    message: `Your transfer of ₦${amount.toLocaleString()} for "${course.title}" (Ref: ${ref}) has been submitted for admin verification.`,
    data: { courseId, paymentId: payment._id, reference: ref },
  });

  return successResponse(
    res,
    201,
    'Manual payment submitted! Your course access will be unlocked as soon as an administrator confirms your bank transfer.',
    {
      manualSubmitted: true,
      reference: ref,
      amount,
      status: 'pending',
      payment,
    }
  );
});

/**
 * GET /api/v1/payments/verify/:ref — Check status of manual payment reference
 */
export const verifyPayment = catchAsync(async (req, res, next) => {
  const { ref } = req.params;

  const payment = await Payment.findOne({ transactionRef: ref }).populate('course', 'title slug');
  if (!payment) return next(new AppError('Payment record not found.', 404));

  return successResponse(res, 200, 'Payment status fetched.', {
    status: payment.status,
    reference: payment.transactionRef,
    amount: payment.amount,
    course: payment.course,
  });
});

/**
 * PATCH /api/v1/payments/:id/status (or /api/v1/admin/orders/:id/status) — Admin approves or rejects manual payment
 */
export const updatePaymentStatus = catchAsync(async (req, res, next) => {
  const { status, adminNote = '' } = req.body;
  if (!['success', 'failed', 'pending', 'refunded'].includes(status)) {
    return next(new AppError('Invalid payment status.', 400));
  }

  const payment = await Payment.findById(req.params.id);
  if (!payment) return next(new AppError('Payment record not found.', 404));

  payment.status = status;
  if (adminNote !== undefined) payment.adminNote = adminNote;
  await payment.save();

  if (status === 'success') {
    await Order.findOneAndUpdate({ payment: payment._id }, { status: 'completed' });
    await enrollStudent(payment.student, payment.course, payment._id);

    // Send confirmation emails (non-blocking)
    try {
      const [user, course] = await Promise.all([
        (await import('../models/User.js')).default.findById(payment.student),
        Course.findById(payment.course),
      ]);
      if (user && course) {
        await sendPaymentConfirmation(user, course, payment);
        await sendEnrollmentConfirmation(user, course);
      }
    } catch (err) {
      console.error('Email error after manual payment approval:', err.message);
    }
  } else if (status === 'failed') {
    await Order.findOneAndUpdate({ payment: payment._id }, { status: 'failed' });
    await Notification.create({
      user: payment.student,
      type: 'payment',
      title: 'Payment Verification Update',
      message:
        adminNote ||
        `Your manual payment (Ref: ${payment.transactionRef}) could not be confirmed. Please contact support with your transfer receipt.`,
      data: { paymentId: payment._id, reference: payment.transactionRef },
    });
  }

  const populated = await Payment.findById(payment._id)
    .populate('student', 'name email')
    .populate('course', 'title slug');

  return successResponse(
    res,
    200,
    status === 'success'
      ? 'Payment approved and student enrolled in the course!'
      : `Payment status updated to ${status}.`,
    populated
  );
});

/**
 * GET /api/v1/payments/my
 */
export const getMyPayments = catchAsync(async (req, res) => {
  const payments = await Payment.find({ student: req.user._id })
    .populate('course', 'title slug thumbnail')
    .sort('-createdAt');

  return successResponse(res, 200, 'Payment history fetched.', payments);
});

/**
 * GET /api/v1/payments — Admin
 */
export const getAllPayments = catchAsync(async (req, res) => {
  const { page = 1, limit = 50, status } = req.query;
  const filter = {};

  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = Payment.find(filter)
    .populate('student', 'name email')
    .populate('course', 'title slug')
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit));

  const [payments, total] = await Promise.all([query, Payment.countDocuments(filter)]);

  return successResponse(res, 200, 'Payments fetched.', payments, paginationMeta(total, page, limit));
});

/**
 * GET /api/v1/payments/:id — Admin
 */
export const getPaymentById = catchAsync(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id)
    .populate('student', 'name email avatar')
    .populate('course', 'title slug thumbnail');

  if (!payment) return next(new AppError('Payment not found.', 404));
  return successResponse(res, 200, 'Payment fetched.', payment);
});
