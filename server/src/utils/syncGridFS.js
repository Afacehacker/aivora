import fs from 'fs';
import path from 'path';
import { MongoClient, GridFSBucket } from 'mongodb';

const ATLAS_URI =
  'mongodb+srv://aivora_admin:AivoraDbPass2026Secure99@cluster0.s2g48sz.mongodb.net/aivora?retryWrites=true&w=majority&appName=Cluster0';

function uploadFilePromise(bucket, filePath, filename, mimeType) {
  return new Promise((resolve, reject) => {
    const size = fs.statSync(filePath).size;
    console.log(`[GridFS] Uploading ${filename} (${(size / (1024 * 1024)).toFixed(1)} MB)...`);

    const uploadStream = bucket.openUploadStream(filename, {
      chunkSizeBytes: 512 * 1024,
      contentType: mimeType,
      metadata: { folder: 'videos', originalName: filename, mimeType },
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(uploadStream);

    uploadStream.on('finish', () => {
      console.log(`[GridFS] ✅ Finished: ${filename}`);
      resolve(true);
    });

    uploadStream.on('error', (err) => {
      console.error(`[GridFS] ❌ Error: ${filename}`, err);
      reject(err);
    });

    readStream.on('error', (err) => {
      uploadStream.destroy(err);
      reject(err);
    });
  });
}

async function main() {
  const client = new MongoClient(ATLAS_URI, { connectTimeoutMS: 30000, socketTimeoutMS: 60000 });
  await client.connect();
  console.log('Connected to MongoDB Atlas.');

  const db = client.db();
  const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

  // 1. Clean any orphaned chunks
  const fileDocs = await db.collection('uploads.files').find({}).project({ _id: 1 }).toArray();
  const validFileIds = fileDocs.map((f) => f._id);
  const delOrphans = await db.collection('uploads.chunks').deleteMany({ files_id: { $nin: validFileIds } });
  console.log(`Cleaned ${delOrphans.deletedCount} orphaned chunks.`);

  // 2. Upload the 3 optimized video files
  const filesToUpload = [
    {
      path: path.join(process.cwd(), 'uploads', 'videos', 'phone-video-call.mp4'),
      filename: 'phone-video-call.mp4',
      mime: 'video/mp4',
    },
    {
      path: path.join(process.cwd(), 'uploads', 'videos', 'laptop-video-call.mp4'),
      filename: 'laptop-video-call.mp4',
      mime: 'video/mp4',
    },
    {
      path: path.join(process.cwd(), 'uploads', 'videos', 'laptop-video-call-paid-tutorial.mov'),
      filename: 'laptop-video-call-paid-tutorial.mov',
      mime: 'video/mp4',
    },
    {
      path: path.join(process.cwd(), 'uploads', 'videos', 'laptop-video-call-paid-tutorial.mp4'),
      filename: 'laptop-video-call-paid-tutorial.mp4',
      mime: 'video/mp4',
    },
  ];

  for (const item of filesToUpload) {
    if (fs.existsSync(item.path)) {
      // Remove previous doc if present
      const oldDocs = await bucket.find({ filename: item.filename }).toArray();
      for (const d of oldDocs) {
        await bucket.delete(d._id).catch(() => {});
      }
      await uploadFilePromise(bucket, item.path, item.filename, item.mime);
    }
  }

  // 3. Sync Course and Lesson records
  console.log('\n--- Syncing Courses and Lessons ---');
  const phoneCourse = await db.collection('courses').findOne({ slug: 'phone-video-call' });
  if (phoneCourse) {
    await db.collection('courses').updateOne(
      { _id: phoneCourse._id },
      { $set: { previewVideo: '/api/v1/media/videos/phone-video-call.mp4', updatedAt: new Date() } }
    );
    await db.collection('lessons').updateMany(
      { course: phoneCourse._id },
      { $set: { title: 'Phone Video Call Master Tutorial', videoUrl: '/api/v1/media/videos/laptop-video-call-paid-tutorial.mov', isPreview: false, updatedAt: new Date() } }
    );
    console.log('[DB] ✅ Phone Video Call Course & Lessons synced');
  }

  const laptopCourse = await db.collection('courses').findOne({ slug: 'laptoppc-video-call' });
  if (laptopCourse) {
    await db.collection('courses').updateOne(
      { _id: laptopCourse._id },
      { $set: { previewVideo: '/api/v1/media/videos/laptop-video-call.mp4', updatedAt: new Date() } }
    );
    await db.collection('lessons').updateMany(
      { course: laptopCourse._id },
      { $set: { title: 'Laptop/PC Video Call Master Tutorial', videoUrl: '/api/v1/media/videos/laptop-video-call-paid-tutorial.mov', isPreview: false, updatedAt: new Date() } }
    );
    console.log('[DB] ✅ Laptop/PC Video Call Course & Lessons synced');
  }

  const stats = await db.stats();
  console.log(`\nFinal MongoDB Atlas DB dataSize: ${(stats.dataSize / (1024 * 1024)).toFixed(1)} MB / 512 MB`);
  await client.close();
  console.log('🎉 SUCCESS: GridFS sync complete!');
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
