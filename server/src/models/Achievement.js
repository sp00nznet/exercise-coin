const mongoose = require('mongoose');

// Predefined achievements that users can earn
const achievementSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['steps', 'exercise', 'mining', 'coins', 'streak', 'special'],
    required: true
  },
  icon: {
    type: String,
    default: 'trophy'
  },
  requirement: {
    type: Number,
    required: true
  },
  coinReward: {
    type: Number,
    default: 0
  },
  order: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Achievement', achievementSchema);
