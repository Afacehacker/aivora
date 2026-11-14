import path from 'path';
import fs from 'fs';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import { isCloudinaryConfigured } from '../middleware/upload.js';
import { uploadImage, uploadVideo } from '../services/cloudinary.service.js';

/**
 * POST /api/v1/admin/upload — Upload image, video, or PDF resource before/during course creation
 */
export const handleMediaUpload = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please select an image, video, or resource file to upload.', 400));
  }

  const isVideo = req.file.mimetype.startsWith('video/');
  const isImage = req.file.mimetype.startsWith('image/');
  const subFolder = isImage ? 'images' : isVideo ? 'videos' : 'resources';

  // If Cloudinary is configured with real keys, upload there and remove temp local file
  if (isCloudinaryConfigured() && (isImage || isVideo)) {
    try {
      const result = isVideo
        ? await uploadVideo(req.file.path, 'aivora/videos')
        : await uploadImage(req.file.path, 'aivora/images');

      // Remove local file after cloud upload
      fs.unlink(req.file.path, () => {});

      return successResponse(res, 200, 'Media uploaded to Cloudinary successfully.', {
        url: result.url,
        publicId: result.publicId,
        duration: result.duration || 0,
        type: isVideo ? 'video' : 'image',
        originalName: req.file.originalname,
      });
    } catch (err) {
      console.error('Cloudinary upload fallback to local disk:', err.message);
    }
  }

  // Build accessible relative URL served from Express static /uploads
  const fileUrl = `/uploads/${subFolder}/${req.file.filename}`;

  return successResponse(res, 200, 'File uploaded successfully.', {
    url: fileUrl,
    filename: req.file.filename,
    type: isVideo ? 'video' : isImage ? 'image' : 'file',
    size: req.file.size,
    originalName: req.file.originalname,
  });
});

/**
 * GET /api/v1/admin/media — List uploaded local videos & images so admin can pick from existing uploads
 */
export const listUploadedMedia = catchAsync(async (req, res) => {
  const uploadsRoot = path.join(process.cwd(), 'uploads');
  const folders = ['videos', 'images', 'resources'];
  const items = [];

  folders.forEach((folder) => {
    const dirPath = path.join(uploadsRoot, folder);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      files.forEach((file) => {
        if (file.startsWith('.')) return;
        const stat = fs.statSync(path.join(dirPath, file));
        items.push({
          filename: file,
          folder,
          type: folder === 'videos' ? 'video' : folder === 'images' ? 'image' : 'file',
          url: `/uploads/${folder}/${file}`,
          size: stat.size,
          createdAt: stat.mtime,
        });
      });
    }
  });

  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return successResponse(res, 200, 'Uploaded media files fetched.', items);
});
