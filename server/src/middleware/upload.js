import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { imageStorage, videoStorage } from '../config/cloudinary.js';
import { AppError } from './errorHandler.js';

// Check if Cloudinary is configured with real credentials
const isCloudinaryConfigured = () => {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  return Boolean(
    name &&
      key &&
      secret &&
      name !== 'your_cloud_name' &&
      key !== 'your_api_key' &&
      secret !== 'your_api_secret'
  );
};

// On Vercel serverless, use os.tmpdir() for writable staging; locally use process.cwd()/uploads
const baseUploadsRoot = process.env.VERCEL
  ? path.join(os.tmpdir(), 'aivora-uploads')
  : path.join(process.cwd(), 'uploads');

const uploadsDir = baseUploadsRoot;
const imagesDir = path.join(uploadsDir, 'images');
const videosDir = path.join(uploadsDir, 'videos');
const resourcesDir = path.join(uploadsDir, 'resources');

[uploadsDir, imagesDir, videosDir, resourcesDir].forEach((dir) => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    // Ignore read-only fs errors in restricted environments
  }
});

// Local disk storage fallback
const createDiskStorage = (subFolder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const target = path.join(uploadsDir, subFolder);
      try {
        if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
      } catch {}
      cb(null, target);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safeBase = path
        .basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .slice(0, 40);
      cb(null, `${Date.now()}-${safeBase}${ext}`);
    },
  });

// File filter for images
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed (jpg, jpeg, png, webp, gif)', 400), false);
  }
};

// File filter for videos
const videoFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only video files are allowed (mp4, mov, avi, mkv, webm)', 400), false);
  }
};

// Combined media filter (image, video, or PDF/attachment)
const mediaFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedVideoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.3gp', '.flv'];
  const allowedImageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
  const allowedDocExts = ['.pdf', '.zip'];

  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/') ||
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/zip' ||
    file.mimetype === 'application/octet-stream' ||
    allowedVideoExts.includes(ext) ||
    allowedImageExts.includes(ext) ||
    allowedDocExts.includes(ext)
  ) {
    cb(null, true);
  } else {
    cb(new AppError('Unsupported file format. Upload an image, video, PDF, or ZIP.', 400), false);
  }
};

// Dynamic storage for generic media uploads
const dynamicLocalMediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let sub = 'resources';
    if (file.mimetype.startsWith('image/')) sub = 'images';
    else if (file.mimetype.startsWith('video/')) sub = 'videos';
    const target = path.join(uploadsDir, sub);
    try {
      if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
    } catch {}
    cb(null, target);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .slice(0, 45);
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  },
});

// Image upload middleware (single)
export const uploadImage = multer({
  storage: isCloudinaryConfigured() ? imageStorage : createDiskStorage('images'),
  fileFilter: imageFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
}).single('image');

// Image upload (thumbnail field name)
export const uploadThumbnail = multer({
  storage: isCloudinaryConfigured() ? imageStorage : createDiskStorage('images'),
  fileFilter: imageFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
}).single('thumbnail');

// Avatar upload
export const uploadAvatar = multer({
  storage: isCloudinaryConfigured() ? imageStorage : createDiskStorage('images'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single('avatar');

// Video upload middleware
export const uploadVideo = multer({
  storage: isCloudinaryConfigured() ? videoStorage : createDiskStorage('videos'),
  fileFilter: videoFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
}).single('video');

// Universal media upload (image, video, or resource attachment)
export const uploadMediaFile = multer({
  storage: dynamicLocalMediaStorage,
  fileFilter: mediaFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
}).single('file');

// Chunked media upload (memory storage for assembling chunk by chunk in MongoDB)
export const uploadChunkMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per chunk
}).any();

export { isCloudinaryConfigured, uploadsDir };
