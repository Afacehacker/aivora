import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { imageStorage, videoStorage } from '../config/cloudinary.js';
import { AppError } from './errorHandler.js';

// Check if Cloudinary is configured with real credentials
const isCloudinaryConfigured = () => {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  return (
    name &&
    key &&
    secret &&
    name !== 'your_cloud_name' &&
    key !== 'your_api_key' &&
    secret !== 'your_api_secret'
  );
};

// Ensure local uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
const imagesDir = path.join(uploadsDir, 'images');
const videosDir = path.join(uploadsDir, 'videos');
const resourcesDir = path.join(uploadsDir, 'resources');

[uploadsDir, imagesDir, videosDir, resourcesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Local disk storage fallback
const createDiskStorage = (subFolder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(uploadsDir, subFolder));
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
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/') ||
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/zip'
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
    cb(null, path.join(uploadsDir, sub));
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

export { isCloudinaryConfigured, uploadsDir };
