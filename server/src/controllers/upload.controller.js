import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import MediaFile from '../models/MediaFile.js';
import UploadChunk from '../models/UploadChunk.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import { isCloudinaryConfigured } from '../middleware/upload.js';
import cloudinary from '../config/cloudinary.js';
import { uploadImage, uploadVideo } from '../services/cloudinary.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bundledUploadsDir = path.resolve(__dirname, '../../uploads');

/**
 * Helper to upload buffer directly to Cloudinary via stream
 */
const uploadBufferToCloudinary = (buffer, filename, isVideo, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: isVideo ? 'video' : 'auto',
        folder: `aivora/${folder}`,
        public_id: path.parse(filename).name,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Helper to store buffer in MongoDB GridFS bucket
 */
const saveBufferToGridFS = async (filename, buffer, mimeType, folder, originalName) => {
  if (!mongoose.connection.db) return false;
  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });

  // Delete existing file with same filename if present
  try {
    const existing = await bucket.find({ filename }).toArray();
    for (const doc of existing) {
      await bucket.delete(doc._id).catch(() => {});
    }
  } catch {}

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: mimeType,
      metadata: { folder, originalName, mimeType },
    });
    uploadStream.end(buffer, (err) => {
      if (err) return reject(err);
      resolve(true);
    });
  });
};

/**
 * POST /api/v1/admin/upload — Standard single upload for files (e.g. images, small assets)
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

  // 2) Persist in MongoDB GridFS and MediaFile collection so uploads survive serverless restarts
  if (req.file.path && fs.existsSync(req.file.path)) {
    try {
      const fileBuffer = fs.readFileSync(req.file.path);

      // Save to GridFS (arbitrary size support)
      await saveBufferToGridFS(
        req.file.filename,
        fileBuffer,
        req.file.mimetype,
        subFolder,
        req.file.originalname
      ).catch(() => {});

      // Fallback in MediaFile if <= 15MB
      if (req.file.size <= 15 * 1024 * 1024) {
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
        ).catch(() => {});
      }
    } catch (dbErr) {
      console.error('MongoDB storage persistence warning:', dbErr.message);
    }
  }

  const fileUrl = `/api/v1/media/${subFolder}/${req.file.filename}`;

  return successResponse(res, 200, 'File uploaded successfully.', {
    url: fileUrl,
    filename: req.file.filename,
    type: isVideo ? 'video' : isImage ? 'image' : 'file',
    size: req.file.size,
    originalName: req.file.originalname,
  });
});

/**
 * POST /api/v1/admin/upload-chunk — Chunked video uploader
 * Bypasses Vercel 4.5MB serverless body limits by slicing videos into ~2.5MB pieces,
 * assembling them safely in MongoDB GridFS so videos of ANY duration/size upload reliably.
 */
export const handleChunkUpload = catchAsync(async (req, res, next) => {
  const file = req.files?.chunk?.[0] || req.files?.file?.[0] || req.file;
  if (!file) {
    return next(new AppError('No chunk data received. Please select a valid video.', 400));
  }

  const { uploadId, filename, folder, mimeType, originalName } = req.body;
  const chunkIndex = parseInt(req.body.chunkIndex, 10);
  const totalChunks = parseInt(req.body.totalChunks, 10);

  if (!uploadId || isNaN(chunkIndex) || isNaN(totalChunks) || !filename) {
    return next(
      new AppError('Missing required chunk metadata: uploadId, chunkIndex, totalChunks, filename.', 400)
    );
  }

  const subFolder = folder || (mimeType?.startsWith('image/') ? 'images' : 'videos');
  const isVideo = subFolder === 'videos' || (mimeType || '').startsWith('video/');
  const isImage = subFolder === 'images' || (mimeType || '').startsWith('image/');

  // 1) Upsert chunk in MongoDB
  await UploadChunk.findOneAndUpdate(
    { uploadId, chunkIndex },
    {
      uploadId,
      chunkIndex,
      totalChunks,
      filename,
      folder: subFolder,
      mimeType: mimeType || file.mimetype || 'video/mp4',
      originalName: originalName || '',
      data: file.buffer,
    },
    { upsert: true, new: true }
  );

  const chunkCount = await UploadChunk.countDocuments({ uploadId });

  // 2) If more chunks remaining, return progress acknowledgment
  if (chunkCount < totalChunks) {
    return successResponse(res, 200, `Chunk ${chunkIndex + 1} of ${totalChunks} uploaded.`, {
      uploadId,
      chunkIndex,
      totalChunks,
      completed: false,
      receivedChunks: chunkCount,
      percent: Math.round((chunkCount / totalChunks) * 100),
    });
  }

  // 3) All chunks received! Retrieve and assemble in sequence
  const allChunks = await UploadChunk.find({ uploadId }).sort({ chunkIndex: 1 });
  if (allChunks.length < totalChunks) {
    return successResponse(res, 200, 'Awaiting final chunks...', {
      uploadId,
      completed: false,
      receivedChunks: allChunks.length,
      totalChunks,
    });
  }

  const fullBuffer = Buffer.concat(allChunks.map((c) => c.data));
  let finalUrl = `/api/v1/media/${subFolder}/${filename}`;
  let cloudinaryDuration = 0;

  // 4) If Cloudinary is configured, upload the full video
  if (isCloudinaryConfigured()) {
    try {
      const cRes = await uploadBufferToCloudinary(fullBuffer, filename, isVideo, subFolder);
      if (cRes && (cRes.secure_url || cRes.url)) {
        finalUrl = cRes.secure_url || cRes.url;
        cloudinaryDuration = cRes.duration || 0;
      }
    } catch (cErr) {
      console.warn('Cloudinary upload warning (using GridFS/DB storage):', cErr.message);
    }
  }

  // 5) Store in MongoDB GridFS (streams natively without size limits)
  try {
    await saveBufferToGridFS(
      filename,
      fullBuffer,
      mimeType || 'video/mp4',
      subFolder,
      originalName || filename
    );
  } catch (gridErr) {
    console.warn('GridFS save warning:', gridErr.message);
  }

  // 6) Also store in MediaFile if <= 15MB for backward compatibility
  if (fullBuffer.length <= 15 * 1024 * 1024) {
    try {
      await MediaFile.findOneAndUpdate(
        { filename },
        {
          filename,
          originalName: originalName || filename,
          folder: subFolder,
          mimeType: mimeType || 'video/mp4',
          size: fullBuffer.length,
          data: fullBuffer,
        },
        { upsert: true }
      );
    } catch (mErr) {
      console.warn('MediaFile fallback warning:', mErr.message);
    }
  }

  // 7) Clean up temporary chunks from MongoDB
  await UploadChunk.deleteMany({ uploadId }).catch(() => {});

  return successResponse(res, 200, 'Video file uploaded and processed successfully.', {
    url: finalUrl,
    filename,
    type: isVideo ? 'video' : isImage ? 'image' : 'file',
    size: fullBuffer.length,
    duration: cloudinaryDuration,
    originalName: originalName || filename,
    completed: true,
  });
});

/**
 * GET /uploads/:folder/:filename & /api/v1/media/:folder/:filename
 * Public media streamer with full HTTP 206 Byte Range support for video seeking
 */
export const serveStoredMedia = catchAsync(async (req, res, next) => {
  const { folder, filename } = req.params;

  // 1) Check candidate static disk paths first (works locally and in bundled builds)
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

  // 2) Check MongoDB GridFS Bucket (primary store for chunked and large videos)
  if (mongoose.connection?.db) {
    try {
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
      const files = await bucket.find({ filename }).limit(1).toArray();

      if (files && files.length > 0) {
        const fileDoc = files[0];
        const total = fileDoc.length;
        const contentType =
          fileDoc.contentType ||
          fileDoc.metadata?.mimeType ||
          (folder === 'videos' ? 'video/mp4' : 'application/octet-stream');

        res.setHeader('Content-Type', contentType);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

        const range = req.headers.range;
        if (range) {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
          const chunkSize = end - start + 1;

          res.status(206);
          res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
          res.setHeader('Content-Length', chunkSize);

          const downloadStream = bucket.openDownloadStreamByName(filename, {
            start,
            end: end + 1, // GridFS end is exclusive
          });
          return downloadStream.pipe(res);
        }

        res.setHeader('Content-Length', total);
        return bucket.openDownloadStreamByName(filename).pipe(res);
      }
    } catch (gridErr) {
      console.warn('GridFS read check warning:', gridErr.message);
    }
  }

  // 3) Check MongoDB MediaFile collection (for legacy single-file uploads)
  const media = await MediaFile.findOne({ filename });
  if (media && media.data) {
    const buffer = media.data;
    const total = buffer.length;
    const range = req.headers.range;

    res.setHeader('Content-Type', media.mimeType || (folder === 'videos' ? 'video/mp4' : 'application/octet-stream'));
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
  }

  return next(new AppError('Media file not found.', 404));
});

/**
 * GET /api/v1/admin/media — List uploaded videos & images
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
        try {
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
        } catch {}
      }
    });
  });

  // 2) Scan MongoDB GridFS Bucket
  if (mongoose.connection?.db) {
    try {
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
      const gridFiles = await bucket.find().sort({ uploadDate: -1 }).toArray();
      gridFiles.forEach((doc) => {
        if (!itemsMap.has(doc.filename)) {
          const folder = doc.metadata?.folder || 'videos';
          itemsMap.set(doc.filename, {
            filename: doc.filename,
            folder,
            type: folder === 'videos' ? 'video' : folder === 'images' ? 'image' : 'file',
            url: `/api/v1/media/${folder}/${doc.filename}`,
            size: doc.length,
            createdAt: doc.uploadDate,
          });
        }
      });
    } catch {}
  }

  // 3) Scan MongoDB MediaFile collection
  const dbMedia = await MediaFile.find({}, 'filename folder mimeType size createdAt').sort('-createdAt');
  dbMedia.forEach((doc) => {
    if (!itemsMap.has(doc.filename)) {
      itemsMap.set(doc.filename, {
        filename: doc.filename,
        folder: doc.folder,
        type: doc.folder === 'videos' ? 'video' : doc.folder === 'images' ? 'image' : 'file',
        url: `/api/v1/media/${doc.folder}/${doc.filename}`,
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
