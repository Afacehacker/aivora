import express from 'express';
import {
  register,
  verifyEmail,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { uploadAvatar } from '../middleware/upload.js';
import validate from '../middleware/validate.js';
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  updateProfileValidator,
} from '../validators/auth.validator.js';

const router = express.Router();

router.post('/register', registerValidator, validate, register);
router.get('/verify-email', verifyEmail);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', loginValidator, validate, login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.patch('/update-profile', protect, uploadAvatar, updateProfileValidator, validate, updateProfile);
router.patch('/change-password', protect, changePassword);

export default router;
