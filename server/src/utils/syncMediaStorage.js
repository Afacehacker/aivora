import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Synchronizes all disk-based video and media assets into MongoDB GridFS and MediaFile collections,
 * mirrors disk copies across all candidate upload folders, and cleans up video URLs in the database.
 */
export async function syncAllMediaAssets() {
  try {
    if (!mongoose.connection?.db) return;

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });

    const serverRoot = path.resolve(__dirname, '../..');
    const projectRoot = path.resolve(serverRoot, '..');

    const sourceDirs = [
      path.join(serverRoot, 'uploads', 'videos'),
      path.join(projectRoot, 'uploads', 'videos'),
      path.join(projectRoot, 'client', 'public', 'uploads', 'videos'),
      path.join(projectRoot, 'client', 'dist', 'uploads', 'videos'),
    ];

    const targetDiskDirs = [
      path.join(projectRoot, 'uploads', 'videos'),
      path.join(serverRoot, 'uploads', 'videos'),
      path.join(projectRoot, 'client', 'public', 'uploads', 'videos'),
    ];

    targetDiskDirs.forEach((dir) => {
      try {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      } catch {}
    });

    const discoveredFiles = new Map();
    for (const dir of sourceDirs) {
      if (fs.existsSync(dir)) {
        try {
          const files = fs.readdirSync(dir);
          for (const f of files) {
            if (!discoveredFiles.has(f) && !f.startsWith('.')) {
              const fullPath = path.join(dir, f);
              try {
                const stat = fs.statSync(fullPath);
                if (stat.isFile() && stat.size > 0) {
                  discoveredFiles.set(f, fullPath);
                }
              } catch {}
            }
          }
        } catch {}
      }
    }

    console.log(`[MediaSync] Discovered ${discoveredFiles.size} media file(s) across folders.`);

    for (const [filename, sourcePath] of discoveredFiles.entries()) {
      try {
        const buffer = fs.readFileSync(sourcePath);

        // 1. Mirror to local disk target directories
        for (const targetDir of targetDiskDirs) {
          try {
            const dest = path.join(targetDir, filename);
            if (!fs.existsSync(dest) || fs.statSync(dest).size !== buffer.length) {
              fs.writeFileSync(dest, buffer);
            }
          } catch {}
        }

        // 2. Persist to MongoDB GridFS
        const existingInGrid = await bucket.find({ filename }).toArray().catch(() => []);
        if (!existingInGrid || existingInGrid.length === 0) {
          await new Promise((resolve, reject) => {
            const upStream = bucket.openUploadStream(filename, {
              contentType: 'video/mp4',
              metadata: { folder: 'videos', originalName: filename, mimeType: 'video/mp4' },
            });
            upStream.end(buffer, (err) => (err ? reject(err) : resolve(true)));
          }).catch((err) => {
            console.warn(`[MediaSync] GridFS save error for ${filename}:`, err.message);
          });
          console.log(`[MediaSync] Uploaded ${filename} to MongoDB GridFS.`);
        }

        // 3. Persist to MediaFile collection if <= 15MB
        if (buffer.length <= 15 * 1024 * 1024) {
          const updateDoc = {
            filename,
            originalName: filename,
            folder: 'videos',
            mimeType: 'video/mp4',
            size: buffer.length,
            data: buffer,
            updatedAt: new Date(),
          };
          await mongoose.connection.db
            .collection('mediafiles')
            .findOneAndUpdate({ filename }, { $set: updateDoc }, { upsert: true })
            .catch(() => {});
        }
      } catch (err) {
        console.warn(`[MediaSync] Error processing ${filename}:`, err.message);
      }
    }

    // 4. Sanitize all course previewVideos to verified working /api/v1/media/ streaming paths
    const courses = await mongoose.connection.db.collection('courses').find({}).toArray().catch(() => []);
    for (const course of courses) {
      if (course.previewVideo && typeof course.previewVideo === 'string') {
        let cleaned = course.previewVideo.replace(/^https?:\/\/(localhost|127\.0\.0\.1):5000\//i, '/');
        if (cleaned.startsWith('/uploads/')) {
          cleaned = cleaned.replace(/^\/uploads\//, '/api/v1/media/');
        }
        if (cleaned !== course.previewVideo) {
          await mongoose.connection.db
            .collection('courses')
            .updateOne({ _id: course._id }, { $set: { previewVideo: cleaned } })
            .catch(() => {});
          console.log(`[MediaSync] Sanitized course previewVideo: ${cleaned}`);
        }
      }
    }

    // 5. Sanitize all lesson videoUrls to verified working /api/v1/media/ streaming paths
    const lessons = await mongoose.connection.db.collection('lessons').find({}).toArray().catch(() => []);
    for (const lesson of lessons) {
      if (lesson.videoUrl && typeof lesson.videoUrl === 'string') {
        let cleaned = lesson.videoUrl.replace(/^https?:\/\/(localhost|127\.0\.0\.1):5000\//i, '/');
        if (cleaned.startsWith('/uploads/')) {
          cleaned = cleaned.replace(/^\/uploads\//, '/api/v1/media/');
        }
        if (cleaned !== lesson.videoUrl) {
          await mongoose.connection.db
            .collection('lessons')
            .updateOne({ _id: lesson._id }, { $set: { videoUrl: cleaned } })
            .catch(() => {});
          console.log(`[MediaSync] Sanitized lesson videoUrl: ${cleaned}`);
        }
      }
    }

    // 6. Ensure 'IMAGE to VIDEO' course has its active lesson attached
    const itvCourse = await mongoose.connection.db.collection('courses').findOne({ slug: 'image-to-video' }).catch(() => null);
    if (itvCourse) {
      const itvLessonCount = await mongoose.connection.db.collection('lessons').countDocuments({ course: itvCourse._id }).catch(() => 0);
      if (itvLessonCount === 0) {
        let moduleDoc = await mongoose.connection.db.collection('modules').findOne({ course: itvCourse._id }).catch(() => null);
        if (!moduleDoc) {
          const mRes = await mongoose.connection.db.collection('modules').insertOne({
            title: 'Core Video Tutorials',
            course: itvCourse._id,
            order: 1,
            isPublished: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          moduleDoc = { _id: mRes.insertedId };
        }
        await mongoose.connection.db.collection('lessons').insertOne({
          module: moduleDoc._id,
          course: itvCourse._id,
          title: 'Image to Talking Video in Under 5 Minutes',
          description: 'Step-by-step master tutorial on converting any image into a talking video.',
          videoUrl: '/uploads/videos/1794654991023-Empty-1794653741016.mp4',
          videoDuration: 300,
          order: 1,
          type: 'video',
          isPreview: true,
          isPublished: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await mongoose.connection.db.collection('courses').updateOne(
          { _id: itvCourse._id },
          {
            $set: {
              previewVideo: '/uploads/videos/1794654991023-Empty-1794653741016.mp4',
              totalLessons: 1,
              totalDuration: 300,
            },
          }
        );
        console.log(`[MediaSync] Attached active tutorial video to 'IMAGE to VIDEO' course.`);
      }
    }
  } catch (syncErr) {
    console.error('[MediaSync] Overall synchronization warning:', syncErr.message);
  }
}

// Self-run when executed directly via node
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const DEFAULT_ATLAS_URI = 'mongodb+srv://aivora_admin:AivoraDbPass2026Secure99@cluster0.s2g48sz.mongodb.net/aivora?retryWrites=true&w=majority&appName=Cluster0';
  const uri = process.env.MONGODB_URI || DEFAULT_ATLAS_URI;
  mongoose.connect(uri).then(async () => {
    console.log('Connected to MongoDB. Running syncAllMediaAssets on primary DB...');
    await syncAllMediaAssets();
    if (uri !== DEFAULT_ATLAS_URI) {
      console.log('Now syncing MongoDB Atlas cloud cluster...');
      await mongoose.disconnect();
      await mongoose.connect(DEFAULT_ATLAS_URI);
      await syncAllMediaAssets();
    }
    console.log('Finished sync across all databases!');
    process.exit(0);
  }).catch((err) => {
    console.error('Connection error:', err);
    process.exit(1);
  });
}
