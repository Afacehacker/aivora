import mongoose from 'mongoose';

const adminActivityLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    targetModel: {
      type: String,
      default: null,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

adminActivityLogSchema.index({ admin: 1 });
adminActivityLogSchema.index({ createdAt: -1 });

const AdminActivityLog = mongoose.model('AdminActivityLog', adminActivityLogSchema);
export default AdminActivityLog;
