const mongoose = require('mongoose');

// One hour of the 3DS hardware pedometer history, keyed by real UTC hour start.
const pedometerHourSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  consoleHash: {
    type: String,
    required: true
  },
  hourStart: {
    type: Date,
    required: true
  },
  steps: {            // highest count ever reported for this hour (only grows)
    type: Number,
    default: 0
  },
  paidSteps: {        // steps already turned into coins
    type: Number,
    default: 0
  },
  flagged: {          // part of an implausible day; never paid again
    type: Boolean,
    default: false
  }
}, { timestamps: true });

pedometerHourSchema.index({ userId: 1, consoleHash: 1, hourStart: 1 }, { unique: true });
pedometerHourSchema.index({ userId: 1, hourStart: 1 });
pedometerHourSchema.index({ consoleHash: 1, hourStart: 1 });

module.exports = mongoose.model('PedometerHour', pedometerHourSchema);
