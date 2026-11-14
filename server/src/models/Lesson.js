import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: [true, 'Module reference is required'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    videoUrl: {
      type: String,
      default: null,
    },
    videoPublicId: {
      type: String,
      default: null,
    },
    videoDuration: {
      type: Number, // in seconds
      default: 0,
    },
    thumbnail: {
      type: String,
      default: null,
    },
    order: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      enum: ['video', 'text', 'quiz'],
      default: 'video',
    },
    resources: [
      {
        title: { type: String },
        url: { type: String },
        type: { type: String, enum: ['pdf', 'link', 'file'] },
      },
    ],
    isPreview: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    // text content for text-type lessons
    content: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

lessonSchema.index({ module: 1, order: 1 });
lessonSchema.index({ course: 1 });

const Lesson = mongoose.model('Lesson', lessonSchema);
export default Lesson;
