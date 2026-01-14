const mongoose = require('mongoose');

// Tracks transfers that qualify for friendliness bonuses
// (both users were actively hiking when they traded)
const friendlyTransferSchema = new mongoose.Schema({
  // The original transfer
  transferId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CoinTransfer',
    required: true
  },

  // Users involved
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Transfer amount
  transferAmount: {
    type: Number,
    required: true
  },

  // Exercise session IDs that were active during transfer
  fromUserSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExerciseSession'
  },
  toUserSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExerciseSession'
  },

  // Location where transfer happened (if available)
  location: {
    latitude: Number,
    longitude: Number
  },

  // Whether bonus was awarded
  bonusAwarded: {
    type: Boolean,
    default: false
  },
  bonusAmount: {
    type: Number,
    default: 0
  },
  bonusAwardedAt: {
    type: Date,
    default: null
  },

  // The weekly friendliness pool this belongs to
  weekNumber: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for finding transfers eligible for bonus
friendlyTransferSchema.index({ weekNumber: 1, year: 1, bonusAwarded: 1 });
friendlyTransferSchema.index({ fromUserId: 1 });
friendlyTransferSchema.index({ toUserId: 1 });

module.exports = mongoose.model('FriendlyTransfer', friendlyTransferSchema);
