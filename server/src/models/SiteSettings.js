import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String },
  avatar: { type: String, default: null },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  comment: { type: String, required: true },
  isApproved: { type: Boolean, default: true },
});

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  order: { type: Number, default: 0 },
});

const paymentAccountSchema = new mongoose.Schema({
  bankName: { type: String, required: true, trim: true },
  accountName: { type: String, required: true, trim: true },
  accountNumber: { type: String, required: true, trim: true },
  instructions: { type: String, default: '', trim: true },
  isActive: { type: Boolean, default: true },
});

const siteSettingsSchema = new mongoose.Schema(
  {
    // Hero Section
    heroHeadline: { type: String, default: 'Learn AI Skills That Matter' },
    heroSubHeadline: {
      type: String,
      default: 'Master artificial intelligence with expert-led courses designed for real-world impact.',
    },
    heroCTAPrimary: { type: String, default: 'Explore Courses' },
    heroCTASecondary: { type: String, default: 'Learn More' },

    // Featured Courses
    featuredCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],

    // Testimonials
    testimonials: [testimonialSchema],

    // FAQs
    faqs: [faqSchema],

    // Manual Bank Transfer Payment Accounts (managed from Admin Panel)
    paymentAccounts: {
      type: [paymentAccountSchema],
      default: [
        {
          bankName: 'Moniepoint MFB',
          accountName: 'AIVORA Creative Hub',
          accountNumber: '8012345678',
          instructions: 'Use your registered email or full name as transfer narration.',
          isActive: true,
        },
      ],
    },
    paymentNotice: {
      type: String,
      default:
        'Payments cannot be received from OPay because transfers from OPay are currently facing gateway problems. However, we accept payments from any other Nigerian bank such as PalmPay, Kuda, Moniepoint, UBA, Access Bank, FirstBank, or any other Nigerian bank (not OPay).',
    },

    // Contact Info
    contactEmail: { type: String, default: 'support@aivora.com' },
    contactPhone: { type: String, default: '' },
    contactAddress: { type: String, default: '' },

    // Social Links
    socialLinks: {
      facebook: { type: String, default: '' },
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
      youtube: { type: String, default: '' },
      tiktok: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      telegram: { type: String, default: '' },
    },

    // Telegram Channel & Popup Settings (Managed via Admin Settings)
    telegramChannelUrl: {
      type: String,
      default: '',
    },
    telegramPopup: {
      enabled: { type: Boolean, default: true },
      channelUrl: { type: String, default: '' },
      title: { type: String, default: 'Join our Telegram Channel! 🚀' },
      description: {
        type: String,
        default:
          'Be the first to get exclusive AI video prompts, course drops, free tutorials, and direct support from fellow creators.',
      },
      buttonText: { type: String, default: 'Join Telegram Channel' },
      additionalLinks: [
        {
          label: { type: String, default: '' },
          url: { type: String, default: '' },
        },
      ],
    },

    // Footer
    footerText: { type: String, default: '© 2024 AIVORA. All rights reserved.' },

    // Announcement Banner
    announcementBanner: {
      text: { type: String, default: '' },
      isActive: { type: Boolean, default: false },
      color: { type: String, default: '#6366f1' },
    },

    // SEO Settings
    seoSettings: {
      homeTitle: { type: String, default: 'AIVORA - AI Education Platform' },
      homeDescription: {
        type: String,
        default: 'Learn AI skills with AIVORA. Expert-led courses on machine learning, deep learning, and more.',
      },
      homeKeywords: {
        type: String,
        default: 'AI, machine learning, deep learning, education, online courses',
      },
    },
  },
  { timestamps: true }
);

const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);
export default SiteSettings;
