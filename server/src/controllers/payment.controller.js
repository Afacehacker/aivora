import Payment from '../models/Payment.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import Order from '../models/Order.js';
import Coupon from '../models/Coupon.js';
import Notification from '../models/Notification.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../middleware/errorHandler.js';
import { successResponse, paginationMeta } from '../utils/apiResponse.js';
import {
  initializePaystack,
  verifyPaystackPayment,
  verifyPaystackWebhook,
  generatePaymentReference,
} from '../services/payment.service.js';
import {
  sendPaymentConfirmation,
  sendEnrollmentConfirmation,
} from '../services/email.service.js';

// Helper: Enroll student after successful payment
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
    message: 'You have been successfully enrolled in a course. Start learning now!',
    data: { courseId, enrollmentId: enrollment._id },
  });

  return enrollment;
};

/**
 * POST /api/v1/payments/initialize
 */
export const initializePayment = catchAsync(async (req, res, next) => {
  const { courseId, provider = 'paystack', couponCode } = req.body;

  const course = await Course.findById(courseId);
  if (!course) return next(new AppError('Course not found.', 404));
  if (!course.isPublished) return next(new AppError('This course is not available.', 400));

  // Check if already enrolled
  const alreadyEnrolled = await Enrollment.findOne({ student: req.user._id, course: courseId });
  if (alreadyEnrolled) return next(new AppError('You are already enrolled in this course.', 400));

  let amount = course.price;

  // Apply discount if active
  if (course.discountPrice && course.discountExpiry && new Date(course.discountExpiry) > new Date()) {
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
    if (couponDoc.applicableCourses.length && !couponDoc.applicableCourses.map(String).includes(String(courseId))) {
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

  const ref = generatePaymentReference();

  // Create pending payment
  const payment = await Payment.create({
    student: req.user._id,
    course: courseId,
    amount,
    currency: 'NGN',
    paymentProvider: provider,
    transactionRef: ref,
    status: 'pending',
    metadata: { courseTitle: course.title, couponCode: couponCode || null },
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

  // Initialize payment with provider
  let paymentData;
  try {
    paymentData = await initializePaystack(req.user.email, amount, ref, {
      studentId: String(req.user._id),
      courseId: String(courseId),
      courseTitle: course.title,
    });
  } catch (err) {
    await Payment.findByIdAndUpdate(payment._id, { status: 'failed' });
    return next(new AppError('Payment initialization failed. Please try again.', 500));
  }

  return successResponse(res, 200, 'Payment initialized.', {
    paymentUrl: paymentData.authorization_url,
    reference: ref,
    amount,
  });
});

/**
 * GET /api/v1/payments/verify/:ref
 */
export const verifyPayment = catchAsync(async (req, res, next) => {
  const { ref } = req.params;

  const payment = await Payment.findOne({ transactionRef: ref });
  if (!payment) return next(new AppError('Payment record not found.', 404));

  if (payment.status === 'success') {
    return successResponse(res, 200, 'Payment already verified.', { status: 'success' });
  }

  // Verify with Paystack
  let providerData;
  try {
    providerData = await verifyPaystackPayment(ref);
  } catch (err) {
    return next(new AppError('Payment verification failed. Please contact support.', 500));
  }

  if (providerData.status !== 'success') {
    payment.status = 'failed';
    await payment.save();
    return next(new AppError('Payment was not successful.', 400));
  }

  payment.status = 'success';
  payment.providerRef = providerData.id?.toString();
  await payment.save();

  // Update order
  await Order.findOneAndUpdate({ payment: payment._id }, { status: 'completed' });

  // Enroll student
  const enrollment = await enrollStudent(payment.student, payment.course, payment._id);

  // Send confirmation emails
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
    console.error('Email error after payment:', err.message);
  }

  return successResponse(res, 200, 'Payment verified and enrollment confirmed.', {
    status: 'success',
    enrollmentId: enrollment._id,
  });
});

/**
 * POST /api/v1/payments/webhook/paystack
 */
export const paystackWebhook = catchAsync(async (req, res, next) => {
  const signature = req.headers['x-paystack-signature'];

  if (!verifyPaystackWebhook(req.body, signature)) {
    return res.status(401).json({ success: false, message: 'Invalid webhook signature.' });
  }

  const event = req.body;

  if (event.event === 'charge.success') {
    const { reference } = event.data;

    const payment = await Payment.findOne({ transactionRef: reference });
    if (!payment || payment.status === 'success') {
      return res.status(200).json({ received: true });
    }

    payment.status = 'success';
    payment.providerRef = event.data.id?.toString();
    payment.webhookVerified = true;
    await payment.save();

    await Order.findOneAndUpdate({ payment: payment._id }, { status: 'completed' });

    await enrollStudent(payment.student, payment.course, payment._id);
  }

  return res.status(200).json({ received: true });
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
  const { page = 1, limit = 20, status, search } = req.query;
  const filter = {};

  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  let query = Payment.find(filter)
    .populate('student', 'name email')
    .populate('course', 'title')
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
