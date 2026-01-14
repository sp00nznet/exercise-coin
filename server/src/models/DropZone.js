const mongoose = require('mongoose');

// Stores admin-configured drop zones for targeted treasure distribution
const dropZoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  // Type of zone definition
  zoneType: {
    type: String,
    enum: ['zipcode', 'area', 'point'],
    required: true
  },

  // For zipcode-based zones
  zipcode: {
    type: String,
    default: null
  },

  // Approximate center for zipcode (looked up)
  zipcodeCenter: {
    latitude: Number,
    longitude: Number
  },

  // For area-based zones (polygon)
  polygon: {
    type: [[Number]], // Array of [longitude, latitude] pairs
    default: []
  },

  // For point-based zones
  center: {
    latitude: Number,
    longitude: Number
  },

  // Radius in meters for point-based zones
  radius: {
    type: Number,
    default: 5000
  },

  // Priority for drop selection (higher = more likely)
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },

  // Is this zone active for drops?
  isActive: {
    type: Boolean,
    default: true
  },

  // Scheduling
  activeFrom: {
    type: Date,
    default: null
  },
  activeTo: {
    type: Date,
    default: null
  },

  // Drop settings
  minDropAmount: {
    type: Number,
    default: 0.1
  },
  maxDropAmount: {
    type: Number,
    default: 2
  },

  // Stats
  totalDropsCreated: {
    type: Number,
    default: 0
  },
  totalCoinsDropped: {
    type: Number,
    default: 0
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

dropZoneSchema.index({ isActive: 1, priority: -1 });

module.exports = mongoose.model('DropZone', dropZoneSchema);
