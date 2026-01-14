const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const User = require('../models/User');
const logger = require('../utils/logger');

// Predefined achievements
const ACHIEVEMENTS = [
  // Steps achievements
  { code: 'first_steps', name: 'First Steps', description: 'Take your first 100 steps', category: 'steps', requirement: 100, coinReward: 0.1, order: 1 },
  { code: 'walker', name: 'Walker', description: 'Accumulate 1,000 total steps', category: 'steps', requirement: 1000, coinReward: 0.5, order: 2 },
  { code: 'jogger', name: 'Jogger', description: 'Accumulate 10,000 total steps', category: 'steps', requirement: 10000, coinReward: 2, order: 3 },
  { code: 'runner', name: 'Runner', description: 'Accumulate 50,000 total steps', category: 'steps', requirement: 50000, coinReward: 5, order: 4 },
  { code: 'marathoner', name: 'Marathoner', description: 'Accumulate 100,000 total steps', category: 'steps', requirement: 100000, coinReward: 10, order: 5 },
  { code: 'ultra_marathoner', name: 'Ultra Marathoner', description: 'Accumulate 500,000 total steps', category: 'steps', requirement: 500000, coinReward: 25, order: 6 },
  { code: 'legend', name: 'Legend', description: 'Accumulate 1,000,000 total steps', category: 'steps', requirement: 1000000, coinReward: 50, order: 7 },

  // Exercise time achievements
  { code: 'warm_up', name: 'Warm Up', description: 'Exercise for 10 minutes total', category: 'exercise', requirement: 600, coinReward: 0.5, order: 1 },
  { code: 'getting_fit', name: 'Getting Fit', description: 'Exercise for 1 hour total', category: 'exercise', requirement: 3600, coinReward: 2, order: 2 },
  { code: 'fitness_enthusiast', name: 'Fitness Enthusiast', description: 'Exercise for 10 hours total', category: 'exercise', requirement: 36000, coinReward: 10, order: 3 },
  { code: 'dedicated', name: 'Dedicated', description: 'Exercise for 50 hours total', category: 'exercise', requirement: 180000, coinReward: 25, order: 4 },
  { code: 'fitness_master', name: 'Fitness Master', description: 'Exercise for 100 hours total', category: 'exercise', requirement: 360000, coinReward: 50, order: 5 },

  // Mining achievements
  { code: 'first_mine', name: 'First Mine', description: 'Mine for 1 minute total', category: 'mining', requirement: 60, coinReward: 0.1, order: 1 },
  { code: 'miner', name: 'Miner', description: 'Mine for 1 hour total', category: 'mining', requirement: 3600, coinReward: 2, order: 2 },
  { code: 'mining_pro', name: 'Mining Pro', description: 'Mine for 10 hours total', category: 'mining', requirement: 36000, coinReward: 10, order: 3 },
  { code: 'mining_expert', name: 'Mining Expert', description: 'Mine for 50 hours total', category: 'mining', requirement: 180000, coinReward: 25, order: 4 },

  // Coins earned achievements
  { code: 'first_coin', name: 'First Coin', description: 'Earn your first coin', category: 'coins', requirement: 1, coinReward: 0.5, order: 1 },
  { code: 'coin_collector', name: 'Coin Collector', description: 'Earn 10 coins total', category: 'coins', requirement: 10, coinReward: 2, order: 2 },
  { code: 'wealthy', name: 'Wealthy', description: 'Earn 100 coins total', category: 'coins', requirement: 100, coinReward: 10, order: 3 },
  { code: 'rich', name: 'Rich', description: 'Earn 500 coins total', category: 'coins', requirement: 500, coinReward: 25, order: 4 },
  { code: 'crypto_millionaire', name: 'Crypto Millionaire', description: 'Earn 1,000 coins total', category: 'coins', requirement: 1000, coinReward: 50, order: 5 }
];

class AchievementService {
  // Initialize achievements in database
  static async initializeAchievements() {
    try {
      for (const achievement of ACHIEVEMENTS) {
        await Achievement.findOneAndUpdate(
          { code: achievement.code },
          achievement,
          { upsert: true, new: true }
        );
      }
      logger.info('Achievements initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize achievements:', error);
    }
  }

  // Check and award achievements for a user
  static async checkAchievements(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { newAchievements: [] };
      }

      const newAchievements = [];
      const existingAchievements = await UserAchievement.find({ userId }).select('achievementCode');
      const earnedCodes = new Set(existingAchievements.map(a => a.achievementCode));

      // Check steps achievements
      const stepsAchievements = ACHIEVEMENTS.filter(a => a.category === 'steps');
      for (const achievement of stepsAchievements) {
        if (!earnedCodes.has(achievement.code) && user.totalSteps >= achievement.requirement) {
          const unlocked = await this.unlockAchievement(userId, achievement.code);
          if (unlocked) {
            newAchievements.push(achievement);
          }
        }
      }

      // Check exercise time achievements
      const exerciseAchievements = ACHIEVEMENTS.filter(a => a.category === 'exercise');
      for (const achievement of exerciseAchievements) {
        if (!earnedCodes.has(achievement.code) && user.totalExerciseSeconds >= achievement.requirement) {
          const unlocked = await this.unlockAchievement(userId, achievement.code);
          if (unlocked) {
            newAchievements.push(achievement);
          }
        }
      }

      // Check mining time achievements
      const miningAchievements = ACHIEVEMENTS.filter(a => a.category === 'mining');
      for (const achievement of miningAchievements) {
        if (!earnedCodes.has(achievement.code) && user.totalMiningSeconds >= achievement.requirement) {
          const unlocked = await this.unlockAchievement(userId, achievement.code);
          if (unlocked) {
            newAchievements.push(achievement);
          }
        }
      }

      // Check coins earned achievements
      const coinsAchievements = ACHIEVEMENTS.filter(a => a.category === 'coins');
      for (const achievement of coinsAchievements) {
        if (!earnedCodes.has(achievement.code) && user.totalCoinsEarned >= achievement.requirement) {
          const unlocked = await this.unlockAchievement(userId, achievement.code);
          if (unlocked) {
            newAchievements.push(achievement);
          }
        }
      }

      return { newAchievements };
    } catch (error) {
      logger.error('Error checking achievements:', error);
      return { newAchievements: [] };
    }
  }

  // Unlock a specific achievement for a user
  static async unlockAchievement(userId, achievementCode) {
    try {
      const achievement = ACHIEVEMENTS.find(a => a.code === achievementCode);
      if (!achievement) {
        return false;
      }

      // Check if already unlocked
      const existing = await UserAchievement.findOne({ userId, achievementCode });
      if (existing) {
        return false;
      }

      // Create user achievement record
      await UserAchievement.create({
        userId,
        achievementCode,
        unlockedAt: new Date()
      });

      // Award coin reward if any
      if (achievement.coinReward > 0) {
        await User.findByIdAndUpdate(userId, {
          $inc: { totalCoinsEarned: achievement.coinReward }
        });
      }

      logger.info(`User ${userId} unlocked achievement: ${achievementCode}`);
      return true;
    } catch (error) {
      // Duplicate key error means it's already unlocked
      if (error.code === 11000) {
        return false;
      }
      logger.error('Error unlocking achievement:', error);
      return false;
    }
  }

  // Get all achievements with user progress
  static async getUserAchievements(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { achievements: [] };
      }

      const userAchievements = await UserAchievement.find({ userId });
      const unlockedMap = new Map(userAchievements.map(ua => [ua.achievementCode, ua]));

      const achievements = ACHIEVEMENTS.map(achievement => {
        const userAchievement = unlockedMap.get(achievement.code);
        let progress = 0;

        // Calculate progress based on category
        switch (achievement.category) {
          case 'steps':
            progress = Math.min(user.totalSteps / achievement.requirement, 1);
            break;
          case 'exercise':
            progress = Math.min(user.totalExerciseSeconds / achievement.requirement, 1);
            break;
          case 'mining':
            progress = Math.min(user.totalMiningSeconds / achievement.requirement, 1);
            break;
          case 'coins':
            progress = Math.min(user.totalCoinsEarned / achievement.requirement, 1);
            break;
          default:
            progress = 0;
        }

        return {
          ...achievement,
          unlocked: !!userAchievement,
          unlockedAt: userAchievement?.unlockedAt || null,
          progress: progress * 100
        };
      });

      // Sort by category, then by order, with unlocked first
      achievements.sort((a, b) => {
        if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.order - b.order;
      });

      return { achievements };
    } catch (error) {
      logger.error('Error getting user achievements:', error);
      return { achievements: [] };
    }
  }

  // Get new unnotified achievements
  static async getUnnotifiedAchievements(userId) {
    try {
      const userAchievements = await UserAchievement.find({ userId, notified: false });
      const achievements = [];

      for (const ua of userAchievements) {
        const achievement = ACHIEVEMENTS.find(a => a.code === ua.achievementCode);
        if (achievement) {
          achievements.push({
            ...achievement,
            unlockedAt: ua.unlockedAt
          });
        }
      }

      // Mark as notified
      await UserAchievement.updateMany(
        { userId, notified: false },
        { $set: { notified: true } }
      );

      return { achievements };
    } catch (error) {
      logger.error('Error getting unnotified achievements:', error);
      return { achievements: [] };
    }
  }
}

module.exports = AchievementService;
