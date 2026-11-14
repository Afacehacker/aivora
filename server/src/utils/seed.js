import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import SiteSettings from '../models/SiteSettings.js';
import Coupon from '../models/Coupon.js';
import generateSlug from './generateSlug.js';

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for seeding...');

    // 1. Seed Admin User
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@aivora.com';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'ChangeThisStrongPassword123!';

    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'AIVORA Administrator',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isEmailVerified: true,
        isActive: true,
        bio: 'Lead AI Creative Director & Platform Administrator at AIVORA.',
      });
      console.log(`✅ Created Admin user: ${adminEmail}`);
    } else {
      console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
    }

    // 2. Seed AI Learning Categories
    const categoriesData = [
      {
        name: 'AI Video Creation',
        description: 'Produce professional AI videos using modern AI video-generation tools and cinematic workflows.',
        icon: 'Video',
        color: '#6366f1',
        order: 1,
      },
      {
        name: 'AI Character Transformation',
        description: 'Authorized image transformation, fictional character creation, digital avatars, and responsible likeness workflows.',
        icon: 'UserCheck',
        color: '#8b5cf6',
        order: 2,
      },
      {
        name: 'AI Voice Cloning',
        description: 'Consent-based voice replication, voiceover production, audio cleanup, and professional narration.',
        icon: 'Mic2',
        color: '#06b6d4',
        order: 3,
      },
      {
        name: 'Image to Video',
        description: 'Transform static images into moving cinematic scenes with realistic camera motion and physics.',
        icon: 'Clapperboard',
        color: '#ec4899',
        order: 4,
      },
      {
        name: 'AI Talking Avatars',
        description: 'Create lifelike talking digital presenters and animated avatars for education and marketing.',
        icon: 'Bot',
        color: '#3b82f6',
        order: 5,
      },
      {
        name: 'AI Short Film Production',
        description: 'Master AI storytelling, scene generation, character consistency, and cinematic editing.',
        icon: 'Film',
        color: '#a855f7',
        order: 6,
      },
      {
        name: 'AI Content Creation',
        description: 'Produce high-retention AI content for YouTube, TikTok, Instagram Reels, and commercial brands.',
        icon: 'Sparkles',
        color: '#14b8a6',
        order: 7,
      },
    ];

    const categoryMap = {};
    for (const cat of categoriesData) {
      const slug = generateSlug(cat.name);
      const doc = await Category.findOneAndUpdate(
        { slug },
        { ...cat, slug, isActive: true },
        { upsert: true, new: true }
      );
      categoryMap[slug] = doc._id;
    }
    console.log('✅ Seeded 7 AI Learning Categories.');

    // 3. Seed Initial Demonstration Courses (Administrator can edit or replace anytime)
    const sampleCourses = [
      {
        title: '[Demo] Cinematic AI Video Production Masterclass',
        shortDescription: 'Master text-to-video, camera motion control, lighting direction, and commercial AI filmmaking from scratch.',
        description:
          'This comprehensive demonstration course teaches you the complete end-to-end pipeline for creating broadcast-quality AI videos. You will learn prompt engineering for cinematic framing, temporal consistency, lighting control, and professional assembly.',
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        previewVideo: '/uploads/videos/cinematic-ai-video.mp4',
        category: categoryMap['ai-video-creation'],
        price: 45000,
        discountPrice: 29500,
        discountExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        level: 'beginner',
        tags: ['AI Video', 'Filmmaking', 'Cinematic AI', 'Prompt Engineering'],
        requirements: [
          'A computer or modern smartphone with internet connection',
          'No prior video production or coding experience required',
        ],
        objectives: [
          'Generate 4K cinematic video sequences from text and reference frames',
          'Direct virtual camera pans, zooms, and dolly movements with precision',
          'Maintain visual style consistency across multi-scene productions',
          'Edit, upscale, and color-grade AI footage for commercial delivery',
        ],
        targetAudience: [
          'Beginners and aspiring AI filmmakers',
          'YouTubers and social media creators',
          'Digital marketers and creative agency teams',
        ],
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
                videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
                videoDuration: 420,
                order: 1,
                isPreview: true,
                isPublished: true,
                resources: [
                  { title: 'AI Cinematic Prompt Formula Guide (PDF)', url: 'https://aivora.com/resources/prompt-guide.pdf', type: 'pdf' },
                ],
              },
              {
                title: 'Cinematic Lighting & Camera Control Prompts',
                description: 'How to specify lens focal lengths, depth of field, and volumetric lighting.',
                videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
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
                videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
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
      {
        title: '[Demo] Authorized AI Character Design & Talking Avatars',
        shortDescription: 'Design consistent fictional characters, realistic digital presenters, and lip-synced avatars ethically.',
        description:
          'Learn how to build persistent digital characters and studio-grade talking avatars. Covers character sheet generation, facial expression control, lip-sync accuracy, and mandatory IP/consent compliance for commercial projects.',
        thumbnail: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80',
        previewVideo: '/uploads/videos/ai-character-avatar.mp4',
        category: categoryMap['ai-character-transformation'],
        price: 55000,
        discountPrice: 35000,
        discountExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        level: 'intermediate',
        tags: ['AI Characters', 'Digital Avatars', 'Character Consistency'],
        requirements: [
          'Basic familiarity with image generation tools is helpful but not mandatory',
        ],
        objectives: [
          'Create 100% consistent character faces and outfits across dozens of angles',
          'Animate static character portraits into expressive talking presenters',
          'Apply ethical licensing, disclosure, and likeness consent frameworks',
        ],
        targetAudience: [
          'Content creators building virtual brand ambassadors',
          'Storytellers and animation directors',
        ],
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
                videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
                videoDuration: 540,
                order: 1,
                isPreview: true,
                isPublished: true,
                resources: [],
              },
              {
                title: 'Multi-Pose & Facial Expression Rigging',
                description: 'Generating consistent front, profile, and cinematic action shots.',
                videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
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
        title: '[Demo] Professional AI Voiceover & Consent-Based Voice Studio',
        shortDescription: 'Produce studio-grade narration, multilingual dubbing, and authorized voice clones with emotional nuance.',
        description:
          'Transform scripts into hyper-realistic human narration. Learn vocal pacing, emotional inflection, studio acoustic cleanup, and legal consent protocols for commercial voice cloning.',
        thumbnail: null,
        previewVideo: '/uploads/videos/voice-cloning-studio.mp4',
        category: categoryMap['ai-voice-cloning'],
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
    ];

    for (const cData of sampleCourses) {
      const slug = generateSlug(cData.title);
      const existing = await Course.findOne({ slug });
      if (!existing) {
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

        for (const mData of modules) {
          const { lessons, ...modFields } = mData;
          const mod = await Module.create({
            ...modFields,
            course: course._id,
            isPublished: true,
          });

          for (const lData of lessons) {
            await Lesson.create({
              ...lData,
              module: mod._id,
              course: course._id,
            });
          }
        }
        console.log(`✅ Created sample course: ${course.title}`);
      }
    }

    // 4. Seed Default SiteSettings (No fabricated testimonials)
    const defaultFaqs = [
      {
        question: 'Who can join AIVORA?',
        answer: 'AIVORA is built for beginners, content creators, filmmakers, YouTubers, digital marketers, entrepreneurs, and creative professionals worldwide looking to master modern AI production tools.',
        order: 1,
      },
      {
        question: 'Do I need previous AI or technical experience?',
        answer: 'No prior coding, AI, or complex studio production experience is required. Our courses start from the fundamentals and guide you step-by-step through practical real-world workflows.',
        order: 2,
      },
      {
        question: 'How do I access my courses after enrollment?',
        answer: 'Immediately after your payment is verified on our backend, your course is unlocked in your Student Dashboard under "My Learning" for instant streaming.',
        order: 3,
      },
      {
        question: 'What payment methods are accepted?',
        answer: 'We accept Nigerian Naira (cards, bank transfer, USSD) and international cards securely via Paystack and supported payment gateways.',
        order: 4,
      },
      {
        question: 'Can I learn on my phone or tablet?',
        answer: 'Yes! The entire AIVORA platform and course video player are fully optimized for Android phones, iPhones, tablets, laptops, and desktop computers.',
        order: 5,
      },
      {
        question: 'Are courses available permanently?',
        answer: 'Enrolled courses include on-demand access for the lifetime of the course where specified, allowing you to learn at your own pace and revisit lessons anytime.',
        order: 6,
      },
      {
        question: 'Do I receive certificates upon completion?',
        answer: 'Yes. Once you complete 100% of the lessons in an eligible course, a verifiable digital AIVORA Certificate of Completion is automatically unlocked in your dashboard.',
        order: 7,
      },
      {
        question: 'What happens if my payment fails or is interrupted?',
        answer: 'If a transaction fails or is interrupted, you can click "Verify Payment" or open a ticket in Support Management with your payment reference for prompt verification.',
        order: 8,
      },
      {
        question: 'How can I contact support?',
        answer: 'You can reach our team directly through the Support Center inside your Student Dashboard or via our Contact page.',
        order: 9,
      },
    ];

    let settings = await SiteSettings.findOne();
    if (!settings) {
      await SiteSettings.create({
        heroHeadline: 'Your Imagination. Powered by AI.',
        heroSubHeadline:
          'Master the art of AI video creation, digital characters, realistic voice cloning, and cinematic storytelling. Learn the skills to create extraordinary content without expensive equipment or complicated production studios.',
        heroCTAPrimary: 'Explore All Courses',
        heroCTASecondary: 'Start Learning Today',
        faqs: defaultFaqs,
        testimonials: [], // Only display genuine testimonials collected from actual students
        contactEmail: 'support@aivora.com',
        contactPhone: '+234 800 AIVORA AI',
        contactAddress: 'Lagos, Nigeria & Global Online Campus',
        footerText: `© ${new Date().getFullYear()} AIVORA. All rights reserved.`,
      });
      console.log('✅ Seeded default SiteSettings & FAQs.');
    }

    // 5. Seed Welcome Coupon
    await Coupon.findOneAndUpdate(
      { code: 'WELCOME10' },
      {
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        maxUses: 500,
        minOrderAmount: 10000,
        isActive: true,
      },
      { upsert: true }
    );

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seedDatabase();
