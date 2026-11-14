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
