import express from 'express';
import {
  getMyCertificates,
  generateCertificate,
  verifyCertificate,
} from '../controllers/certificate.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public verification
router.get('/verify/:certificateId', verifyCertificate);

// Protected student routes
router.get('/my', protect, getMyCertificates);
router.post('/generate/:courseId', protect, generateCertificate);

export default router;
