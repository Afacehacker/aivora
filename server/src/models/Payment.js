import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'NGN',
    },
    paymentProvider: {
      type: String,
      enum: ['manual'],
      default: 'manual',
    },
    transactionRef: {
      type: String,
      required: true,
      unique: true,
    },
    providerRef: {
      type: String,
      default: null,
    },
    senderName: {
      type: String,
      default: '',
      trim: true,
    },
    senderBank: {
      type: String,
      default: '',
      trim: true,
    },
    recipientBank: {
      type: String,
      default: '',
      trim: true,
    },
    recipientAccountNumber: {
      type: String,
      default: '',
      trim: true,
    },
    proofUrl: {
      type: String,
      default: null,
    },
    transferNote: {
      type: String,
      default: '',
      trim: true,
    },
    adminNote: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    webhookVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ transactionRef: 1 });
paymentSchema.index({ student: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
