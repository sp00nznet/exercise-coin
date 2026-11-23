const mongoose = require('mongoose');

// Last-seen state of a console for a user (clock offset, last sync).
const pedometerConsoleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  consoleHash: {
    type: String,
    required: true
  },
  offsetMinutes: {    // console local clock + offsetMinutes = UTC
    type: Number,
    default: 0
  },
  lastSyncAt: {
    type: Date
  },
  lastTotalSteps: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

pedometerConsoleSchema.index({ userId: 1, consoleHash: 1 }, { unique: true });

module.exports = mongoose.model('PedometerConsole', pedometerConsoleSchema);
