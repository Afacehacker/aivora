import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import {
  sendWelcomeEmail,
  sendEmailVerification,
  sendPasswordReset,
} from '../services/email.service.js';

const JWT_SECRET_DEFAULT = 'aivora_super_secret_jwt_key_2026_production_secure_998877';

// Generate JWT token
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || JWT_SECRET_DEFAULT, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// Send token response with cookie
const createSendToken = (user, statusCode, res, message = 'Success') => {
  const token = signToken(user._id);
  const cookieDays = parseInt(process.env.JWT_COOKIE_EXPIRES || '7', 10) || 7;

  const cookieOptions = {
    expires: new Date(Date.now() + cookieDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  return successResponse(res, statusCode, message, { token, user });
};

/**
 * POST /api/v1/auth/register
 */
export const register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('An account with this email already exists.', 400));
  }

  const user = await User.create({ name, email, password });

  // Generate email verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send emails (non-blocking)
  try {
    await sendWelcomeEmail(user);
    await sendEmailVerification(user, verificationToken);
  } catch (err) {
    console.error('Email send error:', err.message);
  }

  createSendToken(user, 201, res, 'Account created successfully. Please verify your email.');
});

/**
 * GET /api/v1/auth/verify-email/:token or ?token=xxx
 */
export const verifyEmail = catchAsync(async (req, res, next) => {
  const token = req.params.token || req.query.token;
  if (!token) return next(new AppError('Verification token is required.', 400));

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    return next(new AppError('Invalid or expired verification token.', 400));
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  return successResponse(res, 200, 'Email verified successfully.');
});

/**
 * POST /api/v1/auth/login
 */
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been suspended. Please contact support.', 403));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, res, 'Logged in successfully.');
});

/**
 * POST /api/v1/auth/logout
 */
export const logout = catchAsync(async (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  return successResponse(res, 200, 'Logged out successfully.');
});

/**
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if email exists
    return successResponse(res, 200, 'If that email is registered, a reset link has been sent.');
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordReset(user, resetToken);
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Failed to send reset email. Please try again later.', 500));
  }

  return successResponse(res, 200, 'Password reset link sent to your email.');
});

/**
 * POST /api/v1/auth/reset-password/:token or ?token=xxx
 */
export const resetPassword = catchAsync(async (req, res, next) => {
  const token = req.params.token || req.query.token;
  const { password } = req.body;

  if (!token) return next(new AppError('Reset token is required.', 400));

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    return next(new AppError('Invalid or expired reset token.', 400));
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res, 'Password reset successfully.');
});

/**
 * PATCH /api/v1/auth/change-password (protected)
 */
export const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide current and new password.', 400));
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Your current password is incorrect.', 401));
  }

  user.password = newPassword;
  await user.save();

  createSendToken(user, 200, res, 'Password updated successfully.');
});

/**
 * GET /api/v1/auth/me (protected)
 */
export const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  return successResponse(res, 200, 'User profile fetched.', user);
});

/**
 * PATCH /api/v1/auth/update-profile (protected)
 */
export const updateProfile = catchAsync(async (req, res, next) => {
  const { name, bio } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (bio !== undefined) updateData.bio = bio;

  // Handle avatar upload
  if (req.file && req.file.path) {
    updateData.avatar = req.file.path;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
    runValidators: true,
  });

  return successResponse(res, 200, 'Profile updated successfully.', user);
});
