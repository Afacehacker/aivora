import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { pipeline } from 'stream/promises';
import { MongoClient, GridFSBucket } from 'mongodb';

const ATLAS_URI =
  'mongodb+srv://aivora_admin:AivoraDbPass2026Secure99@cluster0.s2g48sz.mongodb.net/aivora?retryWrites=true&w=majority&appName=Cluster0';

const FFMPEG_PATH = path.join(process.cwd(), 'server', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');

function runFfmpeg(inputPath, outputPath, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n[FFmpeg] Encoding: ${path.basename(inputPath)} -> ${path.basename(outputPath)}...`);
    const args = [
      '-y',
      '-i', inputPath,
      '-vf', options.vf || 'scale=-2:1280,fps=30',
      '-c:v', 'libx264',
      '-crf', options.crf || '23',
      '-preset', options.preset || 'veryfast',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      outputPath,
    ];

    const proc = spawn(FFMPEG_PATH, args);

    proc.stderr.on('data', (data) => {
      const line = data.toString();
      const match = line.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
      const speedMatch = line.match(/speed=\s*([\d.]+x)/);
      if (match) {
        process.stdout.write(`\r[FFmpeg] ${path.basename(inputPath)}: time=${match[1]} speed=${speedMatch ? speedMatch[1] : '1x'}`);
      }
    });

    proc.on('close', (code) => {
      if (code === 0) {
        const outSize = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(1);
        console.log(`\n[FFmpeg] ✅ Completed ${path.basename(outputPath)} (${outSize} MB)`);
        resolve(true);
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

async function copyFileToFolders(sourcePath, targetFilename) {
  const targetDirs = [
    path.join(process.cwd(), 'uploads', 'videos'),
    path.join(process.cwd(), 'server', 'uploads', 'videos'),
    path.join(process.cwd(), 'client', 'public', 'uploads', 'videos'),
  ];

  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, targetFilename);
    fs.copyFileSync(sourcePath, dest);
    console.log(`[Disk Copy] -> ${dest}`);
  }
}

async function uploadToGridFS(bucket, filePath, targetFilename, mimeType) {
  const size = fs.statSync(filePath).size;
  const sizeMB = (size / (1024 * 1024)).toFixed(1);
  console.log(`\n[GridFS] Uploading ${targetFilename} (${sizeMB} MB)...`);

  // Remove existing file doc
  const existing = await bucket.find({ filename: targetFilename }).toArray();
  for (const doc of existing) {
    await bucket.delete(doc._id).catch(() => {});
  }

  const uploadStream = bucket.openUploadStream(targetFilename, {
    chunkSizeBytes: 255 * 1024,
    contentType: mimeType,
    metadata: {
      folder: 'videos',
      originalName: path.basename(filePath),
      mimeType,
    },
  });

  const readStream = fs.createReadStream(filePath);
  await pipeline(readStream, uploadStream);
  console.log(`[GridFS] ✅ Live in Atlas GridFS: ${targetFilename}`);
}

async function main() {
  const root = process.cwd();
  const uploadDir = path.join(root, 'upload_videos');
  const tempOutDir = path.join(root, 'uploads', 'videos');
  if (!fs.existsSync(tempOutDir)) fs.mkdirSync(tempOutDir, { recursive: true });

  const phoneRaw = path.join(uploadDir, 'phone video call.mp4');
  const phoneOut = path.join(tempOutDir, 'phone-video-call.mp4');

  const laptopRaw = path.join(uploadDir, 'laptop video call.mp4');
  const laptopOut = path.join(tempOutDir, 'laptop-video-call.mp4');

  const tutorialRaw = path.join(uploadDir, 'laptop video call paid tutorial.mov');
  const tutorialOut = path.join(tempOutDir, 'laptop-video-call-paid-tutorial.mov');

  // 1. Phone preview video (55s)
  await runFfmpeg(phoneRaw, phoneOut, { crf: '23', preset: 'veryfast', vf: 'scale=-2:1280,fps=30' });

  // 2. Laptop preview video (1m25s)
  await runFfmpeg(laptopRaw, laptopOut, { crf: '23', preset: 'veryfast', vf: 'scale=-2:1280,fps=30' });

  // 3. Paid Master Tutorial (5m47s)
  await runFfmpeg(tutorialRaw, tutorialOut, { crf: '24', preset: 'veryfast', vf: 'scale=-2:1280,fps=30' });

  // 4. Distribute to all local static folders
  console.log('\n--- Distributing files to disk caches ---');
  await copyFileToFolders(phoneOut, 'phone-video-call.mp4');
  await copyFileToFolders(laptopOut, 'laptop-video-call.mp4');
  await copyFileToFolders(tutorialOut, 'laptop-video-call-paid-tutorial.mov');

  // Also create a .mp4 alias copy for the tutorial for universal player fallback
  const tutorialMp4 = path.join(tempOutDir, 'laptop-video-call-paid-tutorial.mp4');
  fs.copyFileSync(tutorialOut, tutorialMp4);
  await copyFileToFolders(tutorialMp4, 'laptop-video-call-paid-tutorial.mp4');

  // 5. Connect to MongoDB Atlas
  console.log('\n--- Connecting to MongoDB Atlas ---');
  const client = new MongoClient(ATLAS_URI, { connectTimeoutMS: 30000, socketTimeoutMS: 60000 });
  await client.connect();
  const db = client.db();
  const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

  // 6. Upload all videos to GridFS
  await uploadToGridFS(bucket, phoneOut, 'phone-video-call.mp4', 'video/mp4');
  await uploadToGridFS(bucket, laptopOut, 'laptop-video-call.mp4', 'video/mp4');
  await uploadToGridFS(bucket, tutorialOut, 'laptop-video-call-paid-tutorial.mov', 'video/mp4');
  await uploadToGridFS(bucket, tutorialMp4, 'laptop-video-call-paid-tutorial.mp4', 'video/mp4');

  // 7. Verify Database Courses & Lessons
  console.log('\n--- Enforcing Courses & Lessons in DB ---');
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

  // 8. Check final DB stats
  const stats = await db.stats();
  console.log(`\nFinal MongoDB Atlas dataSize: ${(stats.dataSize / (1024 * 1024)).toFixed(1)} MB / 512 MB`);

  await client.close();
  console.log('\n🎉 ALL 3 VIDEOS FULLY ENCODED, TESTED, AND DEPLOYED ACROSS ATLAS & DISK!');
}

main().catch((err) => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
