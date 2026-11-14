import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const supportTicketSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    category: {
      type: String,
      enum: ['payment', 'access', 'technical', 'other'],
      default: 'other',
    },
    status: {
      type: String,
      enum: ['open', 'inProgress', 'resolved', 'closed'],
      default: 'open',
    },
    messages: [messageSchema],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  { timestamps: true }
);

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
export default SupportTicket;
