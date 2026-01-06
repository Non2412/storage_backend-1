import mongoose from 'mongoose';

const requestItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  quantityRequested: {
    type: Number,
    required: true,
    min: 1,
  },
  quantityApproved: {
    type: Number,
    default: 0,
  },
  quantityTransferred: {
    type: Number,
    default: 0,
  },
});

const requestSchema = new mongoose.Schema(
  {
    shelterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shelter',
      required: true,
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'transferred', 'completed'],
      default: 'pending',
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    items: [requestItemSchema],
    remark: String,
  },
  { timestamps: true }
);

export default mongoose.models.Request ||
  mongoose.model('Request', requestSchema);
