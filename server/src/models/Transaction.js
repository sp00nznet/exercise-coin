const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  exerciseSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExerciseSession'
  },
  type: {
    type: String,
    enum: ['mining_reward', 'transfer_in', 'transfer_out', 'withdrawal'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  txHash: {
    type: String,
    unique: true,
    sparse: true
  },
  fromAddress: {
    type: String
  },
  toAddress: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },
  confirmations: {
    type: Number,
    default: 0
  },
  blockHeight: {
    type: Number
  },
  miningDurationSeconds: {
    type: Number
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: {
    type: Date
  }
});

// Indexes for efficient queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ txHash: 1 });
transactionSchema.index({ status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
