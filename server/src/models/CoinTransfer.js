const mongoose = require('mongoose');
const crypto = require('crypto');

const coinTransferSchema = new mongoose.Schema({
  // Sender
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Recipient (null for QR transfers until claimed)
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Amount transferred
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },

  // Transfer type
  transferType: {
    type: String,
    enum: ['direct', 'qr_code'],
    required: true
  },

  // For QR transfers - unique claim code
  claimCode: {
    type: String,
    unique: true,
    sparse: true
  },

  // Optional message/note
  message: {
    type: String,
    maxlength: 200,
    default: ''
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'expired', 'cancelled'],
    default: 'pending'
  },

  // When the transfer was completed
  completedAt: {
    type: Date,
    default: null
  },

  // When QR code expires (null for direct transfers)
  expiresAt: {
    type: Date,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique claim code for QR transfers
coinTransferSchema.pre('save', function(next) {
  if (this.transferType === 'qr_code' && !this.claimCode) {
    this.claimCode = crypto.randomBytes(16).toString('hex');
  }
  next();
});

// Index for claim code lookups
coinTransferSchema.index({ claimCode: 1 });

// Index for user transfer history
coinTransferSchema.index({ fromUserId: 1, createdAt: -1 });
coinTransferSchema.index({ toUserId: 1, createdAt: -1 });

// Index for pending transfers
coinTransferSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('CoinTransfer', coinTransferSchema);
