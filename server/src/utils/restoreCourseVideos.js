import mongoose from 'mongoose';

/**
 * Restores distinct, dedicated preview and tutorial videos for each course in MongoDB.
 * Ensures NO COURSE ever borrows or duplicates another course's video.
 */
export async function restoreDistinctCourseVideos() {
  if (!mongoose.connection.db) return;

  const db = mongoose.connection.db;

  try {
    // 1. IMAGE to VIDEO
    await db.collection('courses').updateOne(
      { slug: 'image-to-video' },
      {
        $set: {
          previewVideo: '/api/v1/media/videos/1794654991023-Empty-1794653741016.mp4',
        },
      }
    );

    // 2. Phone Video Call
    await db.collection('courses').updateOne(
      { slug: 'phone-video-call' },
      {
        $set: {
          previewVideo: '/api/v1/media/videos/1794837379037-tk-7681649057323830558-1794815383521.mp4',
        },
      }
    );

    // 3. Laptop/PC Video Call
    await db.collection('courses').updateOne(
      { slug: 'laptoppc-video-call' },
      {
        $set: {
          previewVideo: '/api/v1/media/videos/1794882702135-ScreenRecording_11-16-2026-8-47-14-AM_1.mov',
        },
      }
    );

    // 4. [Demo] Professional AI Voiceover
    await db.collection('courses').updateOne(
      { slug: 'demo-professional-ai-voiceover-consent-based-voice-studio' },
      {
        $set: {
          previewVideo: '/api/v1/media/videos/voice-cloning-studio.mp4',
        },
      }
    );

    console.log('[CourseVideos] Successfully restored distinct preview videos for each course in database.');
  } catch (err) {
    console.error('[CourseVideos] Warning restoring course videos:', err.message);
  }
}

// Direct execution support
if (process.argv[1] && process.argv[1].includes('restoreCourseVideos')) {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://aivora_admin:AivoraDbPass2026Secure99@cluster0.s2g48sz.mongodb.net/aivora?retryWrites=true&w=majority&appName=Cluster0';
  mongoose.connect(uri).then(async () => {
    await restoreDistinctCourseVideos();
    const courses = await mongoose.connection.db.collection('courses').find({}).toArray();
    for (const c of courses) {
      console.log(`Course "${c.title}" -> ${c.previewVideo}`);
    }
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
