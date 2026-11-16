import mongoose from 'mongoose';

const uploadChunkSchema = new mongoose.Schema(
  {
    uploadId: {
      type: String,
      required: true,
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    totalChunks: {
      type: Number,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    folder: {
      type: String,
      enum: ['images', 'videos', 'resources'],
      default: 'videos',
    },
    mimeType: {
      type: String,
      default: 'video/mp4',
    },
    originalName: {
      type: String,
      default: '',
    },
    data: {
      type: Buffer,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 7200, // MongoDB TTL index: automatically deletes chunks 2 hours after creation
    },
  },
  { timestamps: false }
);

uploadChunkSchema.index({ uploadId: 1, chunkIndex: 1 }, { unique: true });

const UploadChunk = mongoose.model('UploadChunk', uploadChunkSchema);
export default UploadChunk;
