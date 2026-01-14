const mongoose = require('mongoose');

const treasureDropSchema = new mongoose.Schema({
  // Who dropped the treasure (null for system/random drops)
  droppedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Location where treasure is dropped
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },

  // Human-readable location name
  locationName: {
    type: String,
    default: ''
  },

  // Amount of coins in this drop
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },

  // Type of drop
  dropType: {
    type: String,
    enum: ['user_drop', 'random_drop', 'event_drop'],
    default: 'user_drop'
  },

  // Optional message from dropper
  message: {
    type: String,
    maxlength: 200,
    default: ''
  },

  // Who collected the treasure (null if uncollected)
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  collectedAt: {
    type: Date,
    default: null
  },

  // Status of the drop
  status: {
    type: String,
    enum: ['active', 'collected', 'expired'],
    default: 'active'
  },

  // When does this drop expire (null = never)
  expiresAt: {
    type: Date,
    default: null
  },

  // Radius in meters within which the treasure can be collected
  collectRadius: {
    type: Number,
    default: 50 // 50 meters
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Geospatial index for location queries
treasureDropSchema.index({ location: '2dsphere' });

// Index for finding active drops
treasureDropSchema.index({ status: 1, expiresAt: 1 });

// Index for user's drops
treasureDropSchema.index({ droppedBy: 1, createdAt: -1 });

module.exports = mongoose.model('TreasureDrop', treasureDropSchema);
