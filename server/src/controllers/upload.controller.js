import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import MediaFile from '../models/MediaFile.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import { isCloudinaryConfigured } from '../middleware/upload.js';
import { uploadImage, uploadVideo } from '../services/cloudinary.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bundledUploadsDir = path.resolve(__dirname, '../../uploads');

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

  // 1) If Cloudinary is configured with real keys, upload there and remove temp local file
  if (isCloudinaryConfigured() && (isImage || isVideo)) {
    try {
      const result = isVideo
        ? await uploadVideo(req.file.path, 'aivora/videos')
        : await uploadImage(req.file.path, 'aivora/images');

      fs.unlink(req.file.path, () => {});

      return successResponse(res, 200, 'Media uploaded to Cloudinary successfully.', {
        url: result.url,
        publicId: result.publicId,
        duration: result.duration || 0,
        type: isVideo ? 'video' : 'image',
        originalName: req.file.originalname,
      });
    } catch (err) {
      console.error('Cloudinary upload fallback to database/disk:', err.message);
    }
  }

  // 2) Persist in MongoDB MediaFile collection so uploads survive serverless restarts without Cloudinary
  if (req.file.path && fs.existsSync(req.file.path) && req.file.size <= 15 * 1024 * 1024) {
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      await MediaFile.findOneAndUpdate(
        { filename: req.file.filename },
        {
          filename: req.file.filename,
          originalName: req.file.originalname,
          folder: subFolder,
          mimeType: req.file.mimetype,
          size: req.file.size,
          data: fileBuffer,
        },
        { upsert: true, new: true }
      );
    } catch (dbErr) {
      console.error('MongoDB MediaFile persistence warning:', dbErr.message);
    }
  }

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
 * GET /uploads/:folder/:filename — Fallback handler that streams media from MongoDB if not on static disk
 */
export const serveStoredMedia = catchAsync(async (req, res, next) => {
  const { folder, filename } = req.params;

  // Check candidate static disk paths first (works both locally and in bundled serverless)
  const candidatePaths = [
    path.join(bundledUploadsDir, folder, filename),
    path.join(process.cwd(), 'uploads', folder, filename),
    path.join(process.cwd(), 'server', 'uploads', folder, filename),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return res.sendFile(candidate);
    }
  }

  // Check MongoDB MediaFile collection
  const media = await MediaFile.findOne({ filename });
  if (!media || !media.data) {
    return next(new AppError('Media file not found.', 404));
  }

  const buffer = media.data;
  const total = buffer.length;
  const range = req.headers.range;

  res.setHeader('Content-Type', media.mimeType || 'application/octet-stream');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
    const chunkSize = end - start + 1;

    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
    res.setHeader('Content-Length', chunkSize);
    return res.end(buffer.subarray(start, end + 1));
  }

  res.setHeader('Content-Length', total);
  return res.status(200).end(buffer);
});

/**
 * GET /api/v1/admin/media — List uploaded videos & images (from both disk & MongoDB)
 */
export const listUploadedMedia = catchAsync(async (req, res) => {
  const candidateRoots = [
    bundledUploadsDir,
    path.join(process.cwd(), 'uploads'),
    path.join(process.cwd(), 'server', 'uploads'),
  ];
  const folders = ['videos', 'images', 'resources'];
  const itemsMap = new Map();

  // 1) Scan static disk uploads
  candidateRoots.forEach((uploadsRoot) => {
    folders.forEach((folder) => {
      const dirPath = path.join(uploadsRoot, folder);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        files.forEach((file) => {
          if (file.startsWith('.') || itemsMap.has(file)) return;
          const stat = fs.statSync(path.join(dirPath, file));
          itemsMap.set(file, {
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
  });

  // 2) Scan MongoDB MediaFile collection (excluding binary data buffer for fast listing)
  const dbMedia = await MediaFile.find({}, 'filename folder mimeType size createdAt').sort('-createdAt');
  dbMedia.forEach((doc) => {
    if (!itemsMap.has(doc.filename)) {
      itemsMap.set(doc.filename, {
        filename: doc.filename,
        folder: doc.folder,
        type: doc.folder === 'videos' ? 'video' : doc.folder === 'images' ? 'image' : 'file',
        url: `/uploads/${doc.folder}/${doc.filename}`,
        size: doc.size,
        createdAt: doc.createdAt,
      });
    }
  });

  const items = Array.from(itemsMap.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return successResponse(res, 200, 'Uploaded media files fetched.', items);
});
