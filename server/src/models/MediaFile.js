import mongoose from 'mongoose';

const mediaFileSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    originalName: {
      type: String,
      default: '',
    },
    folder: {
      type: String,
      enum: ['images', 'videos', 'resources'],
      default: 'images',
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    data: {
      type: Buffer,
      required: true,
    },
  },
  { timestamps: true }
);

const MediaFile = mongoose.model('MediaFile', mediaFileSchema);
export default MediaFile;
