import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
    },
    shortDescription: {
      type: String,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    thumbnail: {
      type: String,
      default: null,
    },
    previewVideo: {
      type: String,
      default: null,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Instructor is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      default: null,
      min: [0, 'Discount price cannot be negative'],
    },
    discountExpiry: {
      type: Date,
      default: null,
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    language: {
      type: String,
      default: 'English',
    },
    tags: [{ type: String, trim: true }],
    requirements: [{ type: String, trim: true }],
    objectives: [{ type: String, trim: true }],
    targetAudience: [{ type: String, trim: true }],
    totalDuration: {
      type: Number, // in seconds
      default: 0,
    },
    totalLessons: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    rating: {
      avg: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

// Index for search
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ slug: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ isFeatured: 1 });

const Course = mongoose.model('Course', courseSchema);
export default Course;
