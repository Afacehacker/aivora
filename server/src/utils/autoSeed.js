import User from '../models/User.js';
import Category from '../models/Category.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import SiteSettings from '../models/SiteSettings.js';
import Coupon from '../models/Coupon.js';
import generateSlug from './generateSlug.js';

let autoSeedPromise = null;

/**
 * Automatically ensures the default Admin account, categories, courses (including IMAGE to VIDEO),
 * and site settings exist in MongoDB so the platform works out-of-the-box on a fresh database
 * without requiring ADMIN_EMAIL / ADMIN_PASSWORD env variables or manual CLI seeding.
 */
export const ensureInitialData = async () => {
  if (autoSeedPromise) return autoSeedPromise;

  autoSeedPromise = (async () => {
    try {
      // 1. Ensure Default Admin User exists
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@aivora.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

      let adminUser = await User.findOne({ email: adminEmail });
      if (!adminUser) {
        adminUser = await User.create({
          name: 'AIVORA Administrator',
          email: adminEmail,
          password: adminPassword,
          role: 'admin',
          isEmailVerified: true,
          isActive: true,
          bio: 'Platform Administrator & Lead AI Creative Director at AIVORA.',
        });
        console.log(`✅ Default Admin ensured: ${adminEmail}`);
      } else if (adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        adminUser.isEmailVerified = true;
        await adminUser.save({ validateBeforeSave: false });
      }

      // 2. Ensure Categories exist
      const categoryCount = await Category.countDocuments();
      const categoriesData = [
        {
          name: 'Image to Video',
          description: 'Turn static images and portraits into realistic talking and animated AI videos.',
          icon: 'Video',
          color: '#06b6d4',
          order: 0,
        },
        {
          name: 'AI Video Creation',
          description: 'Master cinematic AI video generation, storytelling, camera control, and production workflows.',
          icon: 'Video',
          color: '#6366f1',
          order: 1,
        },
        {
          name: 'AI Character Transformation',
          description: 'Design consistent AI characters, digital twins, and stylized character animations.',
          icon: 'UserCheck',
          color: '#8b5cf6',
          order: 2,
        },
        {
          name: 'AI Voice Cloning',
          description: 'Create studio-grade voiceovers, multilingual dubbing, and ethical consent-based voice synthesis.',
          icon: 'Mic',
          color: '#ec4899',
          order: 3,
        },
        {
          name: 'AI Image Animation',
          description: 'Bring static portraits, illustrations, and product photography to life with natural motion.',
          icon: 'Sparkles',
          color: '#06b6d4',
          order: 4,
        },
        {
          name: 'Prompt Engineering',
          description: 'Write high-precision prompts for Midjourney, Runway, Sora, Kling, ElevenLabs, and LLMs.',
          icon: 'Terminal',
          color: '#10b981',
          order: 5,
        },
        {
          name: 'AI Content Automation',
          description: 'Build automated content pipelines for YouTube, TikTok, Reels, and digital agencies.',
          icon: 'Cpu',
          color: '#f59e0b',
          order: 6,
        },
        {
          name: 'Monetization with AI Skills',
          description: 'Turn your AI creative production skills into high-income freelance and agency services.',
          icon: 'DollarSign',
          color: '#3b82f6',
          order: 7,
        },
      ];

      const categoryMap = {};
      if (categoryCount < categoriesData.length) {
        for (const cat of categoriesData) {
          const slug = generateSlug(cat.name);
          const doc = await Category.findOneAndUpdate(
            { slug },
            { ...cat, slug, isActive: true },
            { upsert: true, new: true }
          );
          categoryMap[slug] = doc._id;
        }
      } else {
        const allCats = await Category.find();
        allCats.forEach((c) => {
          categoryMap[c.slug] = c._id;
        });
      }

      // 3. Ensure "IMAGE to VIDEO" course and demo courses exist if database has no courses
      const courseCount = await Course.countDocuments();
      if (courseCount === 0) {
        // First: Create the featured "IMAGE to VIDEO" course
        await Course.create({
          title: 'IMAGE to VIDEO',
          slug: 'image-to-video',
          shortDescription: 'Image to a talking video',
          description: 'Learn how to change image to a talking video in less than 5minutes',
          thumbnail: null,
          previewVideo: '/uploads/videos/1794654991023-Empty-1794653741016.mp4',
          category: categoryMap['image-to-video'] || Object.values(categoryMap)[0],
          instructor: adminUser._id,
          price: 10000,
          discountPrice: null,
          level: 'beginner',
          tags: ['Image to Video', 'Talking Video', 'AI Video'],
          requirements: ['A smartphone or computer with internet connection'],
          objectives: [
            'Turn any static portrait or photo into a realistic talking video in under 5 minutes',
            'Synchronize voiceovers and lip movements naturally with AI workflow tools',
          ],
          targetAudience: ['Beginners, content creators, and digital marketers'],
          isPublished: true,
          isFeatured: true,
          status: 'published',
          totalDuration: 0,
          totalLessons: 0,
        });

        // Second: Create the 3 Initial Demo Courses
        const demoCourses = [
          {
            title: '[Demo] Professional AI Voiceover & Consent-Based Voice Studio',
            shortDescription: 'Produce studio-grade narration, multilingual dubbing, and authorized voice clones with emotional nuance.',
            description:
              'Transform scripts into hyper-realistic human narration. Learn vocal pacing, emotional inflection, studio acoustic cleanup, and legal consent protocols for commercial voice cloning.',
            thumbnail: null,
            previewVideo: '/uploads/videos/voice-cloning-studio.mp4',
            category: categoryMap['ai-voice-cloning'] || Object.values(categoryMap)[0],
            price: 38000,
            discountPrice: 24000,
            discountExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            level: 'beginner',
            tags: ['AI Voice', 'Voiceover', 'Audio Production'],
            requirements: ['Any computer or mobile device'],
            objectives: [
              'Generate broadcast-ready voiceovers with natural breathing and pacing',
              'Record and train an authorized voice model using your own voice',
              'Translate and dub video projects into multiple languages while preserving tone',
            ],
            targetAudience: ['YouTubers, audiobook creators, educators, and filmmakers'],
            isPublished: true,
            isFeatured: true,
            status: 'published',
            modules: [
              {
                title: 'Module 1: Studio AI Narration & Vocal Direction',
                description: 'Controlling cadence, emotion, pauses, and mastering.',
                order: 1,
                lessons: [
                  {
                    title: 'Voice Synthesis Fundamentals & Consent Standards',
                    description: 'How modern neural speech synthesis works and legal voice authorization.',
                    videoUrl: '/uploads/videos/voice-cloning-studio.mp4',
                    videoDuration: 490,
                    order: 1,
                    isPreview: true,
                    isPublished: true,
                    resources: [],
                  },
                ],
              },
            ],
          },
          {
            title: '[Demo] Authorized AI Character Design & Talking Avatars',
            shortDescription: 'Design consistent fictional characters, realistic digital presenters, and lip-synced avatars ethically.',
            description:
              'Learn how to build persistent digital characters and studio-grade talking avatars. Covers character sheet generation, facial expression control, lip-sync accuracy, and mandatory IP/consent compliance for commercial projects.',
            thumbnail: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80',
            previewVideo: '/uploads/videos/ai-character-avatar.mp4',
            category: categoryMap['ai-character-transformation'] || Object.values(categoryMap)[0],
            price: 55000,
            discountPrice: 35000,
            discountExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            level: 'intermediate',
            tags: ['AI Characters', 'Digital Avatars', 'Character Consistency'],
            requirements: ['Basic familiarity with image generation tools is helpful but not mandatory'],
            objectives: [
              'Create 100% consistent character faces and outfits across dozens of angles',
              'Animate static character portraits into expressive talking presenters',
              'Apply ethical licensing, disclosure, and likeness consent frameworks',
            ],
            targetAudience: ['Content creators building virtual brand ambassadors', 'Storytellers and animation directors'],
            isPublished: true,
            isFeatured: true,
            status: 'published',
            modules: [
              {
                title: 'Module 1: Character Identity & Multi-Angle Consistency',
                description: 'Building a reusable character reference sheet and seed locking.',
                order: 1,
                lessons: [
                  {
                    title: 'Introduction to Ethical Character Creation & Licensing',
                    description: 'Best practices for original character synthesis and consent-based likeness workflows.',
                    videoUrl: '/uploads/videos/ai-character-avatar.mp4',
                    videoDuration: 540,
                    order: 1,
                    isPreview: true,
                    isPublished: true,
                    resources: [],
                  },
                  {
                    title: 'Multi-Pose & Facial Expression Rigging',
                    description: 'Generating consistent front, profile, and cinematic action shots.',
                    videoUrl: '/uploads/videos/ai-character-avatar.mp4',
                    videoDuration: 860,
                    order: 2,
                    isPreview: false,
                    isPublished: true,
                    resources: [],
                  },
                ],
              },
            ],
          },
          {
            title: '[Demo] Cinematic AI Video Production Masterclass',
            shortDescription: 'Master text-to-video, camera motion control, lighting direction, and commercial AI filmmaking from scratch.',
            description:
              'This comprehensive demonstration course teaches you the complete end-to-end pipeline for creating broadcast-quality AI videos. You will learn prompt engineering for cinematic framing, temporal consistency, lighting control, and professional assembly.',
            thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
            previewVideo: '/uploads/videos/cinematic-ai-video.mp4',
            category: categoryMap['ai-video-creation'] || Object.values(categoryMap)[0],
            price: 45000,
            discountPrice: 29500,
            discountExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            level: 'beginner',
            tags: ['AI Video', 'Filmmaking', 'Cinematic AI', 'Prompt Engineering'],
            requirements: ['A computer or modern smartphone with internet connection'],
            objectives: [
              'Generate 4K cinematic video sequences from text and reference frames',
              'Direct virtual camera pans, zooms, and dolly movements with precision',
              'Maintain visual style consistency across multi-scene productions',
            ],
            targetAudience: ['Beginners and aspiring AI filmmakers', 'YouTubers and social media creators'],
            isPublished: true,
            isFeatured: true,
            status: 'published',
            modules: [
              {
                title: 'Module 1: Foundations of AI Video Generation',
                description: 'Understanding generative video models, aspect ratios, and cinematic prompt syntax.',
                order: 1,
                lessons: [
                  {
                    title: 'Welcome & The Modern AI Studio Pipeline',
                    description: 'Overview of the tools, ethical standards, and creative workflow we will build.',
                    videoUrl: '/uploads/videos/cinematic-ai-video.mp4',
                    videoDuration: 420,
                    order: 1,
                    isPreview: true,
                    isPublished: true,
                    resources: [],
                  },
                  {
                    title: 'Cinematic Lighting & Camera Control Prompts',
                    description: 'How to specify lens focal lengths, depth of field, and volumetric lighting.',
                    videoUrl: '/uploads/videos/cinematic-ai-video.mp4',
                    videoDuration: 780,
                    order: 2,
                    isPreview: false,
                    isPublished: true,
                    resources: [],
                  },
                ],
              },
              {
                title: 'Module 2: Multi-Scene Production & Post-Processing',
                description: 'Sequencing shots, frame interpolation, and audio synchronization.',
                order: 2,
                lessons: [
                  {
                    title: 'Scene Continuity & Motion Brush Workflows',
                    description: 'Directing exact regional motion in complex scenes.',
                    videoUrl: '/uploads/videos/cinematic-ai-video.mp4',
                    videoDuration: 920,
                    order: 1,
                    isPreview: false,
                    isPublished: true,
                    resources: [],
                  },
                ],
              },
            ],
          },
        ];

        for (const cData of demoCourses) {
          const slug = generateSlug(cData.title);
          const { modules, ...courseFields } = cData;
          let totalDuration = 0;
          let totalLessons = 0;
          modules.forEach((m) => {
            m.lessons.forEach((l) => {
              totalLessons += 1;
              totalDuration += l.videoDuration || 0;
            });
          });

          const course = await Course.create({
            ...courseFields,
            slug,
            instructor: adminUser._id,
            totalDuration,
            totalLessons,
          });

          const moduleIds = [];
          for (const mData of modules) {
            const { lessons, ...modFields } = mData;
            const modDoc = await Module.create({
              ...modFields,
              course: course._id,
            });
            const lessonIds = [];
            for (const lData of lessons) {
              const lessonDoc = await Lesson.create({
                ...lData,
                module: modDoc._id,
                course: course._id,
              });
              lessonIds.push(lessonDoc._id);
            }
            modDoc.lessons = lessonIds;
            await modDoc.save();
            moduleIds.push(modDoc._id);
          }
          course.modules = moduleIds;
          await course.save();
        }
        console.log('✅ Initial AIVORA courses seeded automatically.');
      }

      // 4. Ensure SiteSettings exists
      const existingSettings = await SiteSettings.findOne();
      if (!existingSettings) {
        const allCourses = await Course.find().select('_id');
        await SiteSettings.create({
          heroHeadline: 'Your Imagination. Powered by AI.',
          heroSubHeadline:
            'Master the art of AI video creation, digital characters, realistic voice cloning, and cinematic storytelling. Learn the skills to create extraordinary content without expensive equipment or complicated production studios.',
          heroCTAPrimary: 'Explore Courses',
          heroCTASecondary: 'Watch Demo',
          featuredCourses: allCourses.map((c) => c._id),
          contactEmail: 'support@aivora.com',
          contactPhone: '+234 800 AIVORA AI',
          contactAddress: 'Lagos & Global Digital Campus',
          footerText: '© 2026 AIVORA. All rights reserved. Empowering the next generation of AI creators.',
        });
      }

      // 5. Ensure WELCOME10 Coupon exists
      await Coupon.findOneAndUpdate(
        { code: 'WELCOME10' },
        {
          code: 'WELCOME10',
          type: 'percentage',
          value: 10,
          minOrderAmount: 10000,
          maxUses: 500,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error('Auto-seed initialization notice:', err.message);
    }
  })();

  return autoSeedPromise;
};
