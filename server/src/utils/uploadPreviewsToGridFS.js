import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { MongoClient, GridFSBucket } from 'mongodb';

const ATLAS_URI = 'mongodb+srv://aivora_admin:AivoraDbPass2026Secure99@cluster0.s2g48sz.mongodb.net/aivora?retryWrites=true&w=majority&appName=Cluster0';

async function uploadFile(bucket, filePath, targetFilename, mimeType) {
  const size = fs.statSync(filePath).size;
  const sizeMB = (size / (1024 * 1024)).toFixed(1);
  console.log(`\n[Upload] Starting ${targetFilename} (${sizeMB} MB)...`);

  // 1. Remove existing files with this filename
  const existing = await bucket.find({ filename: targetFilename }).toArray();
  for (const doc of existing) {
    console.log(`[Upload] Deleting old file doc: ${doc._id}`);
    await bucket.delete(doc._id).catch(() => {});
  }

  // 2. Open GridFS upload stream with standard 255KB chunk size for maximum network stability
  const uploadStream = bucket.openUploadStream(targetFilename, {
    contentType: mimeType,
    metadata: {
      folder: 'videos',
      originalName: path.basename(filePath),
      mimeType,
    },
  });

  const readStream = fs.createReadStream(filePath);

  let uploadedBytes = 0;
  let lastLoggedPct = -1;
  readStream.on('data', (chunk) => {
    uploadedBytes += chunk.length;
    const pct = Math.floor((uploadedBytes / size) * 100);
    if (pct % 5 === 0 && pct !== lastLoggedPct) {
      lastLoggedPct = pct;
      const mb = (uploadedBytes / (1024 * 1024)).toFixed(1);
      console.log(`[Upload] ${targetFilename}: ${mb} MB / ${sizeMB} MB (${pct}%)`);
    }
  });

  await pipeline(readStream, uploadStream);
  console.log(`[Upload] ✅ Successfully completed ${targetFilename}!`);
}

async function main() {
  const client = new MongoClient(ATLAS_URI, {
    connectTimeoutMS: 30000,
    socketTimeoutMS: 60000,
  });

  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas.');
    const db = client.db();
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    // 1. Upload phone video call (97.3 MB)
    const phoneFile = path.join(process.cwd(), 'upload_videos', 'phone video call.mp4');
    if (fs.existsSync(phoneFile)) {
      await uploadFile(bucket, phoneFile, 'phone-video-call.mp4', 'video/mp4');
    } else {
      console.error('Phone video file not found at:', phoneFile);
    }

    // 2. Upload laptop video call (140.0 MB)
    const laptopFile = path.join(process.cwd(), 'upload_videos', 'laptop video call.mp4');
    if (fs.existsSync(laptopFile)) {
      await uploadFile(bucket, laptopFile, 'laptop-video-call.mp4', 'video/mp4');
    } else {
      console.error('Laptop video file not found at:', laptopFile);
    }

    const stats = await db.stats();
    console.log(`\nFinal DB Stats: Storage: ${(stats.storageSize / (1024 * 1024)).toFixed(1)} MB, Data: ${(stats.dataSize / (1024 * 1024)).toFixed(1)} MB`);
    console.log('\n🎉 ALL PREVIEW VIDEOS LIVE IN GRIDFS!');
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('\nUpload error:', err);
  process.exit(1);
});
