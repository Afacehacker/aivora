import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
    },
    certificateId: {
      type: String,
      required: true,
      unique: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    downloadUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

certificateSchema.index({ certificateId: 1 });
certificateSchema.index({ student: 1 });

const Certificate = mongoose.model('Certificate', certificateSchema);
export default Certificate;
