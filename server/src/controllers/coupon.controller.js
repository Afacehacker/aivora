import Coupon from '../models/Coupon.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../middleware/errorHandler.js';
import { successResponse, paginationMeta } from '../utils/apiResponse.js';

/**
 * POST /api/v1/coupons/validate — Validate coupon
 */
export const validateCoupon = catchAsync(async (req, res, next) => {
  const { code, courseId, amount } = req.body;

  if (!code) return next(new AppError('Coupon code is required.', 400));

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

  if (!coupon) return next(new AppError('Invalid coupon code.', 400));

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return next(new AppError('This coupon has expired.', 400));
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return next(new AppError('This coupon has reached its usage limit.', 400));
  }

  if (amount && amount < coupon.minOrderAmount) {
    return next(new AppError(`Minimum order amount for this coupon is ${coupon.minOrderAmount}.`, 400));
  }

  if (courseId && coupon.applicableCourses.length > 0) {
    if (!coupon.applicableCourses.map(String).includes(String(courseId))) {
      return next(new AppError('This coupon is not applicable to this course.', 400));
    }
  }

  let discount = 0;
  if (amount) {
    if (coupon.type === 'percentage') {
      discount = Math.round(amount * (coupon.value / 100));
    } else {
      discount = Math.min(coupon.value, amount);
    }
  }

  return successResponse(res, 200, 'Coupon is valid.', {
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount,
    finalAmount: amount ? Math.max(amount - discount, 0) : null,
  });
});

/**
 * POST /api/v1/coupons — Admin
 */
export const createCoupon = catchAsync(async (req, res, next) => {
  const { code, type, value, maxUses, minOrderAmount, applicableCourses, expiresAt } = req.body;

  if (!code || !type || value === undefined) {
    return next(new AppError('Code, type, and value are required.', 400));
  }

  const coupon = await Coupon.create({
    code: code.toUpperCase().trim(),
    type,
    value,
    maxUses: maxUses || null,
    minOrderAmount: minOrderAmount || 0,
    applicableCourses: applicableCourses || [],
    expiresAt: expiresAt || null,
  });

  return successResponse(res, 201, 'Coupon created successfully.', coupon);
});

/**
 * GET /api/v1/coupons — Admin
 */
export const getAllCoupons = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, isActive } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const [coupons, total] = await Promise.all([
    Coupon.find(filter).sort('-createdAt').skip(skip).limit(parseInt(limit)),
    Coupon.countDocuments(filter),
  ]);

  return successResponse(res, 200, 'Coupons fetched.', coupons, paginationMeta(total, page, limit));
});

/**
 * PATCH /api/v1/coupons/:id — Admin
 */
export const updateCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!coupon) return next(new AppError('Coupon not found.', 404));
  return successResponse(res, 200, 'Coupon updated.', coupon);
});

/**
 * DELETE /api/v1/coupons/:id — Admin
 */
export const deleteCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return next(new AppError('Coupon not found.', 404));
  return successResponse(res, 200, 'Coupon deleted.');
});
