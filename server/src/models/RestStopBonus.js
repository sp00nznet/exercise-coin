const mongoose = require('mongoose');

/**
 * 🍔 Rest Stop Bonus
 *
 * Tracks bonuses awarded when hiking friends stop at restaurants/cafes together.
 * "Cheers! Enjoy your meal!" 🥂
 */
const restStopBonusSchema = new mongoose.Schema({
  // Users involved (both must be present)
  users: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExerciseSession'
    },
    exerciseMinutes: {
      type: Number,
      default: 0
    },
    bonusReceived: {
      type: Number,
      default: 0
    }
  }],

  // Venue information
  venue: {
    name: {
      type: String
    },
    type: {
      type: String,
      enum: ['fast_food', 'cafe', 'restaurant', 'health_food', 'brewery', 'ice_cream', 'other'],
      default: 'other'
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],  // [longitude, latitude]
        required: true
      }
    },
    placeId: {
      type: String  // Google Places ID or similar
    }
  },

  // Bonus details
  totalBonus: {
    type: Number,
    required: true
  },
  venueMultiplier: {
    type: Number,
    default: 1.0
  },
  message: {
    type: String,
    default: '🍔 Cheers! Enjoy your meal together!'
  },

  // Timing
  restStartedAt: {
    type: Date,
    required: true
  },
  restDurationMinutes: {
    type: Number,
    default: 0
  },
  awardedAt: {
    type: Date,
    default: Date.now
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'awarded', 'expired', 'invalid'],
    default: 'awarded'
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
restStopBonusSchema.index({ 'users.userId': 1, createdAt: -1 });
restStopBonusSchema.index({ 'venue.location': '2dsphere' });
restStopBonusSchema.index({ status: 1 });

module.exports = mongoose.model('RestStopBonus', restStopBonusSchema);
