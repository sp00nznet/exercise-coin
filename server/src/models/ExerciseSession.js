const mongoose = require('mongoose');

const stepDataPointSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true
  },
  stepCount: {
    type: Number,
    required: true
  },
  stepsPerSecond: {
    type: Number,
    required: true
  }
}, { _id: false });

const exerciseSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  totalSteps: {
    type: Number,
    default: 0
  },
  durationSeconds: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'invalid', 'rewarded'],
    default: 'active'
  },
  stepData: [stepDataPointSchema],
  validExerciseSeconds: {
    type: Number,
    default: 0
  },
  isValidExercise: {
    type: Boolean,
    default: false
  },
  invalidReason: {
    type: String
  },
  miningTriggered: {
    type: Boolean,
    default: false
  },
  miningDurationSeconds: {
    type: Number,
    default: 0
  },
  coinsEarned: {
    type: Number,
    default: 0
  },
  transactionId: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
exerciseSessionSchema.index({ userId: 1, createdAt: -1 });
exerciseSessionSchema.index({ status: 1 });

module.exports = mongoose.model('ExerciseSession', exerciseSessionSchema);
