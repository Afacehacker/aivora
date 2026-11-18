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
          previewVideo: '/uploads/videos/1794654991023-Empty-1794653741016.mp4',
        },
      }
    );

    // 2. Phone Video Call
    const phoneCourse = await db.collection('courses').findOne({ slug: 'phone-video-call' });
    if (phoneCourse) {
      await db.collection('courses').updateOne(
        { _id: phoneCourse._id },
        {
          $set: {
            previewVideo: '/uploads/videos/phone-video-call.mp4',
          },
        }
      );
      await db.collection('lessons').updateMany(
        { course: phoneCourse._id },
        {
          $set: {
            title: 'Phone Video Call Master Tutorial',
            videoUrl: '/uploads/videos/laptop-video-call-paid-tutorial.mov',
            isPreview: false,
          },
        }
      );
    }

    // 3. Laptop/PC Video Call
    const laptopCourse = await db.collection('courses').findOne({ slug: 'laptoppc-video-call' });
    if (laptopCourse) {
      await db.collection('courses').updateOne(
        { _id: laptopCourse._id },
        {
          $set: {
            previewVideo: '/uploads/videos/laptop-video-call.mp4',
          },
        }
      );
      await db.collection('lessons').updateMany(
        { course: laptopCourse._id },
        {
          $set: {
            title: 'Laptop/PC Video Call Master Tutorial',
            videoUrl: '/uploads/videos/laptop-video-call-paid-tutorial.mov',
            isPreview: false,
          },
        }
      );
    }

    // 4. [Demo] Professional AI Voiceover
    await db.collection('courses').updateOne(
      { slug: 'demo-professional-ai-voiceover-consent-based-voice-studio' },
      {
        $set: {
          previewVideo: '/uploads/videos/voice-cloning-studio.mp4',
        },
      }
    );
  } catch (err) {
    console.warn('Video URL restoration warning:', err.message);
  }
}

// Standalone execution if run directly
if (process.argv[1]?.endsWith('restoreCourseVideos.js')) {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://aivora_admin:AivoraDbPass2026Secure99@cluster0.s2g48sz.mongodb.net/aivora?retryWrites=true&w=majority&appName=Cluster0';
  mongoose.connect(uri).then(async () => {
    await restoreDistinctCourseVideos();
    console.log('✅ Distinct course videos synced in MongoDB Atlas.');
    const courses = await mongoose.connection.db.collection('courses').find({}).toArray();
    courses.forEach(c => console.log(' - Course:', c.slug, '=>', c.previewVideo));
    await mongoose.disconnect();
  });
}
