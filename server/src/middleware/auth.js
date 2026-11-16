import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from './errorHandler.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * Protect routes — verify JWT and attach user to request
 */
export const protect = catchAsync(async (req, res, next) => {
  let token;

  // Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to access this resource.', 401));
  }

  // Verify token
  const jwtSecret =
    process.env.JWT_SECRET || 'aivora_super_secret_jwt_key_2026_production_secure_998877';
  const decoded = jwt.verify(token, jwtSecret);

  // Check if user still exists
  const user = await User.findById(decoded.id).select('+isActive');
  if (!user) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new AppError('Your account has been suspended. Please contact support.', 403));
  }

  req.user = user;
  next();
});

/**
 * Optional Auth — if JWT is present and valid, attaches user; otherwise proceeds as guest
 */
export const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next();
  }

  try {
    const jwtSecret =
      process.env.JWT_SECRET || 'aivora_super_secret_jwt_key_2026_production_secure_998877';
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.id).select('+isActive');
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (err) {
    // Guest fallback
  }

  next();
};

/**
 * Restrict access to specific roles
 * @param {...string} roles - Allowed roles
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};
