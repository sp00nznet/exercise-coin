const mongoose = require('mongoose');

// Tracks which achievements each user has earned
const userAchievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  achievementCode: {
    type: String,
    required: true
  },
  unlockedAt: {
    type: Date,
    default: Date.now
  },
  notified: {
    type: Boolean,
    default: false
  }
});

// Compound index to ensure a user can only have one of each achievement
userAchievementSchema.index({ userId: 1, achievementCode: 1 }, { unique: true });

module.exports = mongoose.model('UserAchievement', userAchievementSchema);
