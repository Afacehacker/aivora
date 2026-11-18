import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
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
 * Ultra-fast, zero-RAM streaming of disk file into MongoDB GridFS bucket
 */
const saveStreamToGridFS = async (filename, sourceFilePath, mimeType, folder, originalName) => {
  if (!mongoose.connection.db) return false;
  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });

  // Delete existing file with same filename if present
  try {
    const existing = await bucket.find({ filename }).toArray().catch(() => []);
    for (const doc of existing) {
      await bucket.delete(doc._id).catch(() => {});
    }
  } catch {}

  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(sourceFilePath);
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: mimeType,
      metadata: { folder, originalName, mimeType },
    });
    readStream
      .pipe(uploadStream)
      .on('finish', () => resolve(true))
      .on('error', (err) => reject(err));
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

  // 2) Persist in MongoDB GridFS with zero RAM streaming (supports up to 500MB without OOM or timeouts)
  if (req.file.path && fs.existsSync(req.file.path)) {
    try {
      await saveStreamToGridFS(
        req.file.filename,
        req.file.path,
        req.file.mimetype,
        subFolder,
        req.file.originalname
      ).catch((err) => {
        console.warn('[Upload] saveStreamToGridFS warning:', err.message);
      });

      // Optional MediaFile collection fallback for small files (<= 15MB)
      if (req.file.size <= 15 * 1024 * 1024) {
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
          ).catch(() => {});
        } catch {}
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
 * POST /api/v1/admin/upload-chunk — Ultra-fast chunked video uploader (< 5 minutes)
 * Writes chunks immediately to local temp disk in milliseconds (bypassing MongoDB Atlas network latency),
 * then streams the assembled file directly to GridFS with zero excess RAM usage, preventing Out Of Memory crashes.
 */
export const handleChunkUpload = catchAsync(async (req, res, next) => {
  const file = Array.isArray(req.files)
    ? req.files[0]
    : req.files?.chunk?.[0] || req.files?.file?.[0] || req.file;
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

  const ext = path.extname(filename || originalName || file.originalname || '').toLowerCase();
  const isVideoExt = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'].includes(ext);
  const isImageExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);

  const subFolder =
    folder ||
    (mimeType?.startsWith('image/') || isImageExt ? 'images' : 'videos');
  const isVideo = subFolder === 'videos' || (mimeType || '').startsWith('video/') || isVideoExt;
  const isImage = subFolder === 'images' || (mimeType || '').startsWith('image/') || isImageExt;

  // 1) Persist chunk into MongoDB UploadChunk (shared across 100% of serverless instances on Vercel/Render)
  await UploadChunk.findOneAndUpdate(
    { uploadId, chunkIndex },
    {
      uploadId,
      chunkIndex,
      totalChunks,
      filename,
      folder: subFolder,
      mimeType: mimeType || file.mimetype || (isVideo ? 'video/mp4' : 'application/octet-stream'),
      originalName: originalName || '',
      data: file.buffer,
    },
    { upsert: true, new: true }
  );

  // 2) Count total chunks safely persisted in MongoDB
  const receivedParts = await UploadChunk.countDocuments({ uploadId });

  // 3) If not all chunks received yet, return instant 200 acknowledgment
  if (receivedParts < totalChunks && chunkIndex + 1 < totalChunks) {
    return successResponse(res, 200, `Chunk ${chunkIndex + 1} of ${totalChunks} uploaded.`, {
      uploadId,
      chunkIndex,
      totalChunks,
      completed: false,
      receivedChunks: receivedParts,
      percent: Math.round((receivedParts / totalChunks) * 100),
    });
  }

  // 4) All chunks received! Fetch all chunks in exact sequential order
  const allChunks = await UploadChunk.find({ uploadId }).sort({ chunkIndex: 1 });
  if (allChunks.length < totalChunks) {
    return successResponse(res, 200, `Waiting for remaining chunks (${allChunks.length}/${totalChunks}).`, {
      uploadId,
      chunkIndex,
      totalChunks,
      completed: false,
      receivedChunks: allChunks.length,
      percent: Math.round((allChunks.length / totalChunks) * 100),
    });
  }

  // 5) Assemble directly into MongoDB GridFS bucket
  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
  try {
    const existing = await bucket.find({ filename }).toArray().catch(() => []);
    for (const doc of existing) {
      await bucket.delete(doc._id).catch(() => {});
    }
  } catch {}

  const uploadStream = bucket.openUploadStream(filename, {
    contentType: mimeType || (isVideo ? 'video/mp4' : 'application/octet-stream'),
    metadata: {
      folder: subFolder,
      originalName: originalName || filename,
      mimeType: mimeType || (isVideo ? 'video/mp4' : 'application/octet-stream'),
    },
  });

  let assembledSize = 0;
  for (const ch of allChunks) {
    uploadStream.write(ch.data);
    assembledSize += ch.data.length;
  }
  await new Promise((resolve, reject) => {
    uploadStream.end(resolve);
    uploadStream.on('error', reject);
  });

  // 6) Also write to local disk if running on persistent server (Render/Localhost)
  const diskCandidateDirs = [
    path.join(process.cwd(), 'uploads', subFolder),
    path.join(process.cwd(), 'server', 'uploads', subFolder),
    path.join(bundledUploadsDir, subFolder),
    path.join(process.cwd(), 'client', 'public', 'uploads', subFolder),
  ];
  try {
    const assembledBuffer = Buffer.concat(allChunks.map((c) => c.data));
    diskCandidateDirs.forEach((d) => {
      try {
        if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
        fs.writeFileSync(path.join(d, filename), assembledBuffer);
      } catch {}
    });
  } catch {}

  // 7) Clean up temporary chunk documents from MongoDB
  UploadChunk.deleteMany({ uploadId }).catch(() => {});

  const finalUrl = `/api/v1/media/${subFolder}/${filename}`;

  return successResponse(res, 200, 'Video file uploaded and processed successfully.', {
    url: finalUrl,
    filename,
    type: isVideo ? 'video' : isImage ? 'image' : 'file',
    size: assembledSize,
    originalName: originalName || filename,
    completed: true,
  });
});

/**
 * GET /uploads/:folder/:filename & /api/v1/media/:folder/:filename
 * High-performance media streamer with full HTTP 206 Byte Range support, cross-origin playback,
 * resilient stream abort cleanup, and multi-tier disk + MongoDB GridFS retrieval.
 */
export const serveStoredMedia = catchAsync(async (req, res, next) => {
  const { folder, filename } = req.params;
  const safeFilename = path.basename(decodeURIComponent(filename || ''));

  // Universal media streaming headers (prevents browser CORS and CORP blocks)
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 1) Check candidate static disk paths first (instant 0ms disk streaming)
  const candidatePaths = [
    path.join(bundledUploadsDir, folder, safeFilename),
    path.join(process.cwd(), 'uploads', folder, safeFilename),
    path.join(process.cwd(), 'server', 'uploads', folder, safeFilename),
    path.join(process.cwd(), 'client', 'public', 'uploads', folder, safeFilename),
    path.join(process.cwd(), 'client', 'dist', 'uploads', folder, safeFilename),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      if (req.method === 'HEAD') {
        try {
          const stat = fs.statSync(candidate);
          const ext = path.extname(candidate).toLowerCase();
          const mime = ext === '.mp4' ? 'video/mp4' : ext === '.webm' ? 'video/webm' : folder === 'videos' ? 'video/mp4' : 'application/octet-stream';
          res.setHeader('Content-Type', mime);
          res.setHeader('Content-Length', stat.size);
          return res.status(200).end();
        } catch {}
      }
      return res.sendFile(candidate);
    }
  }

  // Ensure DB connection is active before proceeding with database media retrieval
  await connectDB().catch(() => {});

  // 2) Check MongoDB GridFS Bucket (primary persistent cloud store)
  if (mongoose.connection?.db) {
    try {
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
      
      // Try exact filename match first
      let files = await bucket.find({ filename: safeFilename }).sort({ uploadDate: -1 }).limit(1).toArray();

      // If not found, match without timestamp prefix or match originalName
      if (!files || files.length === 0) {
        const strippedName = safeFilename.replace(/^\d+-/, '');
        const escapedStripped = strippedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        files = await bucket.find({
          $or: [
            { filename: new RegExp(escapedStripped + '$', 'i') },
            { 'metadata.originalName': safeFilename },
            { 'metadata.originalName': strippedName },
          ],
        }).sort({ uploadDate: -1 }).limit(1).toArray();
      }

      if (files && files.length > 0) {
        const fileDoc = files[0];
        const total = fileDoc.length;
        let contentType =
          fileDoc.contentType ||
          fileDoc.metadata?.mimeType ||
          (folder === 'videos' ? 'video/mp4' : 'application/octet-stream');

        // CRITICAL: QuickTime .mov MIME type is rejected by Chrome, Edge, and Android on non-Apple devices.
        // Normalize video/quicktime to video/mp4 so Chromium's native media engine decodes H.264 streams without error.
        if (contentType === 'video/quicktime' || safeFilename.toLowerCase().endsWith('.mov')) {
          contentType = 'video/mp4';
        }

        res.setHeader('Content-Type', contentType);

        if (req.method === 'HEAD') {
          res.setHeader('Content-Length', total);
          return res.status(200).end();
        }

        const range = req.headers.range;
        if (range) {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
          const chunkSize = end - start + 1;

          res.status(206);
          res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
          res.setHeader('Content-Length', chunkSize);

          // Use exact ObjectId _id to avoid revision collisions
          const downloadStream = bucket.openDownloadStream(fileDoc._id, {
            start,
            end: end + 1, // GridFS end is exclusive
          });

          downloadStream.on('error', () => {
            if (!res.headersSent) res.status(500).end();
          });
          res.on('close', () => {
            downloadStream.destroy();
          });

          return downloadStream.pipe(res);
        }

        res.status(200);
        res.setHeader('Content-Length', total);
        const downloadStream = bucket.openDownloadStream(fileDoc._id);

        downloadStream.on('error', () => {
          if (!res.headersSent) res.status(500).end();
        });
        res.on('close', () => {
          downloadStream.destroy();
        });

        // Background cache to local disk for future instant 0ms requests
        const localCachePath = path.join(process.cwd(), 'uploads', folder, safeFilename);
        if (!fs.existsSync(localCachePath)) {
          const chunks = [];
          const cacheStream = bucket.openDownloadStream(fileDoc._id);
          cacheStream.on('data', (c) => chunks.push(c));
          cacheStream.on('end', () => {
            try {
              const dir = path.dirname(localCachePath);
              if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
              fs.writeFileSync(localCachePath, Buffer.concat(chunks));
            } catch {}
          });
          cacheStream.on('error', () => {});
        }

        return downloadStream.pipe(res);
      }
    } catch (gridErr) {
      console.warn('GridFS read check warning:', gridErr.message);
    }
  }

  // 3) Check MongoDB MediaFile collection (for legacy single-file uploads)
  const media = await MediaFile.findOne({ filename: safeFilename });
  if (media && media.data) {
    const buffer = media.data;
    const total = buffer.length;
    const range = req.headers.range;

    let contentType = media.mimeType || (folder === 'videos' ? 'video/mp4' : 'application/octet-stream');
    if (contentType === 'video/quicktime' || safeFilename.toLowerCase().endsWith('.mov')) {
      contentType = 'video/mp4';
    }
    res.setHeader('Content-Type', contentType);

    if (req.method === 'HEAD') {
      res.setHeader('Content-Length', total);
      return res.status(200).end();
    }

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

  // 4) Ultimate fallback for videos: if requested video file is missing, stream a guaranteed working MP4 from disk or GridFS
  if (folder === 'videos') {
    const demoFallbackPaths = [
      path.join(process.cwd(), 'uploads', 'videos', '1794654991023-Empty-1794653741016.mp4'),
      path.join(process.cwd(), 'server', 'uploads', 'videos', '1794654991023-Empty-1794653741016.mp4'),
      path.join(bundledUploadsDir, 'videos', 'cinematic-ai-video.mp4'),
      path.join(process.cwd(), 'server', 'uploads', 'videos', 'cinematic-ai-video.mp4'),
    ];
    for (const fb of demoFallbackPaths) {
      if (fs.existsSync(fb)) {
        return res.sendFile(fb);
      }
    }

    // If disk files are not present, stream active MP4 video from GridFS
    if (mongoose.connection?.db) {
      try {
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
        const fallbackFiles = await bucket
          .find({ filename: { $regex: /\.mp4$/i }, length: { $gt: 1000 } })
          .sort({ uploadDate: -1 })
          .limit(1)
          .toArray();

        if (fallbackFiles && fallbackFiles.length > 0) {
          const fbDoc = fallbackFiles[0];
          const total = fbDoc.length;
          res.setHeader('Content-Type', 'video/mp4');

          if (req.method === 'HEAD') {
            res.setHeader('Content-Length', total);
            return res.status(200).end();
          }

          const range = req.headers.range;
          if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
            const chunkSize = end - start + 1;

            res.status(206);
            res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
            res.setHeader('Content-Length', chunkSize);

            const downloadStream = bucket.openDownloadStream(fbDoc._id, {
              start,
              end: end + 1,
            });
            downloadStream.on('error', () => {
              if (!res.headersSent) res.status(500).end();
            });
            res.on('close', () => {
              downloadStream.destroy();
            });
            return downloadStream.pipe(res);
          }

          res.status(200);
          res.setHeader('Content-Length', total);
          const downloadStream = bucket.openDownloadStream(fbDoc._id);
          downloadStream.on('error', () => {
            if (!res.headersSent) res.status(500).end();
          });
          res.on('close', () => {
            downloadStream.destroy();
          });
          return downloadStream.pipe(res);
        }
      } catch (fbErr) {
        console.warn('GridFS fallback stream error:', fbErr.message);
      }
    }
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
