const RestStopBonus = require('../models/RestStopBonus');
const ExerciseSession = require('../models/ExerciseSession');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');
const { TOKENOMICS } = require('../config/tokenomics');

/**
 * 🍔 Rest Stop Service
 *
 * Detects when hiking friends stop at restaurants/cafes together
 * and awards bonus coins. "Cheers! Enjoy your meal!" 🥂
 */
class RestStopService {
  /**
   * Check if a user is eligible for a rest stop bonus
   * Called when the mobile app detects the user has stopped at a food venue
   */
  static async checkEligibility(userId, location, venueInfo) {
    try {
      const config = TOKENOMICS.REST_STOP;

      if (!config.ENABLED) {
        return { eligible: false, reason: 'Rest stop bonuses are disabled' };
      }

      // Check cooldown - user can only get one rest stop bonus per 4 hours
      const cooldownTime = new Date(Date.now() - config.COOLDOWN_HOURS * 60 * 60 * 1000);
      const recentBonus = await RestStopBonus.findOne({
        'users.userId': userId,
        awardedAt: { $gte: cooldownTime },
        status: 'awarded'
      });

      if (recentBonus) {
        const nextEligible = new Date(recentBonus.awardedAt.getTime() + config.COOLDOWN_HOURS * 60 * 60 * 1000);
        return {
          eligible: false,
          reason: 'Cooldown active',
          nextEligible
        };
      }

      // Check if user has an active or recent exercise session
      const session = await this.getValidSession(userId, config.MIN_EXERCISE_MINUTES);
      if (!session) {
        return {
          eligible: false,
          reason: `Need at least ${config.MIN_EXERCISE_MINUTES} minutes of exercise first`
        };
      }

      return {
        eligible: true,
        session,
        message: 'Eligible for rest stop bonus! Look for a hiking buddy nearby.'
      };
    } catch (error) {
      logger.error('Error checking rest stop eligibility:', error);
      return { eligible: false, reason: 'Error checking eligibility' };
    }
  }

  /**
   * Claim a rest stop bonus when two friends are at the same venue
   * Both users must call this endpoint within a short time window
   */
  static async claimRestStopBonus(userId, friendId, location, venueInfo) {
    try {
      const config = TOKENOMICS.REST_STOP;

      if (!config.ENABLED) {
        return { success: false, error: 'Rest stop bonuses are disabled' };
      }

      // Validate both users
      if (userId === friendId) {
        return { success: false, error: 'Cannot claim with yourself' };
      }

      // Check both users have valid exercise sessions
      const [userSession, friendSession] = await Promise.all([
        this.getValidSession(userId, config.MIN_EXERCISE_MINUTES),
        this.getValidSession(friendId, config.MIN_EXERCISE_MINUTES)
      ]);

      if (!userSession) {
        return { success: false, error: 'You need more exercise time to qualify' };
      }

      if (!friendSession) {
        return { success: false, error: 'Your friend needs more exercise time to qualify' };
      }

      // Check cooldown for both users
      const cooldownTime = new Date(Date.now() - config.COOLDOWN_HOURS * 60 * 60 * 1000);
      const [userCooldown, friendCooldown] = await Promise.all([
        RestStopBonus.findOne({ 'users.userId': userId, awardedAt: { $gte: cooldownTime }, status: 'awarded' }),
        RestStopBonus.findOne({ 'users.userId': friendId, awardedAt: { $gte: cooldownTime }, status: 'awarded' })
      ]);

      if (userCooldown) {
        return { success: false, error: 'You already received a rest stop bonus recently' };
      }

      if (friendCooldown) {
        return { success: false, error: 'Your friend already received a rest stop bonus recently' };
      }

      // Get venue type multiplier
      const venueType = venueInfo?.type || 'other';
      const venueMultiplier = config.VENUE_MULTIPLIERS[venueType] || 1.0;

      // Calculate bonus
      const baseBonus = config.MIN_BONUS + Math.random() * (config.MAX_BONUS - config.MIN_BONUS);
      const totalBonus = Math.round(baseBonus * venueMultiplier * 100) / 100;
      const bonusPerUser = Math.round((totalBonus / 2) * 100) / 100;

      // Get venue-specific message
      const message = this.getVenueMessage(venueType, venueInfo?.name);

      // Create the rest stop bonus record
      const restStopBonus = await RestStopBonus.create({
        users: [
          {
            userId,
            sessionId: userSession._id,
            exerciseMinutes: Math.floor(userSession.validExerciseSeconds / 60),
            bonusReceived: bonusPerUser
          },
          {
            userId: friendId,
            sessionId: friendSession._id,
            exerciseMinutes: Math.floor(friendSession.validExerciseSeconds / 60),
            bonusReceived: bonusPerUser
          }
        ],
        venue: {
          name: venueInfo?.name || 'Unknown Venue',
          type: venueType,
          location: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude]
          },
          placeId: venueInfo?.placeId
        },
        totalBonus,
        venueMultiplier,
        message,
        restStartedAt: new Date(),
        status: 'awarded'
      });

      // Award coins to both users
      await Promise.all([
        User.findByIdAndUpdate(userId, { $inc: { totalCoinsEarned: bonusPerUser } }),
        User.findByIdAndUpdate(friendId, { $inc: { totalCoinsEarned: bonusPerUser } })
      ]);

      // Get usernames for transaction records
      const [user, friend] = await Promise.all([
        User.findById(userId, 'username'),
        User.findById(friendId, 'username')
      ]);

      // Create transaction records
      await Promise.all([
        Transaction.create({
          userId,
          type: 'mining_reward',
          amount: bonusPerUser,
          status: 'confirmed',
          confirmedAt: new Date(),
          metadata: {
            type: 'rest_stop_bonus',
            restStopBonusId: restStopBonus._id,
            venueName: venueInfo?.name,
            venueType,
            venueMultiplier,
            withFriend: friend?.username || 'Unknown'
          }
        }),
        Transaction.create({
          userId: friendId,
          type: 'mining_reward',
          amount: bonusPerUser,
          status: 'confirmed',
          confirmedAt: new Date(),
          metadata: {
            type: 'rest_stop_bonus',
            restStopBonusId: restStopBonus._id,
            venueName: venueInfo?.name,
            venueType,
            venueMultiplier,
            withFriend: user?.username || 'Unknown'
          }
        })
      ]);

      logger.info(`🍔 Rest stop bonus awarded: ${totalBonus} EXC at ${venueInfo?.name || 'venue'} (${venueType}, ${venueMultiplier}x)`);

      return {
        success: true,
        bonus: {
          id: restStopBonus._id,
          totalBonus,
          bonusPerUser,
          venueType,
          venueMultiplier,
          message
        }
      };
    } catch (error) {
      logger.error('Error claiming rest stop bonus:', error);
      return { success: false, error: 'Failed to claim rest stop bonus' };
    }
  }

  /**
   * Get a valid exercise session for a user
   */
  static async getValidSession(userId, minExerciseMinutes) {
    const minExerciseSeconds = minExerciseMinutes * 60;
    const recentWindow = new Date(Date.now() - 60 * 60 * 1000); // Within last hour

    const session = await ExerciseSession.findOne({
      userId,
      $or: [
        { status: 'active' },
        { status: 'rewarded', endTime: { $gte: recentWindow } },
        { status: 'completed', endTime: { $gte: recentWindow }, miningTriggered: true }
      ],
      validExerciseSeconds: { $gte: minExerciseSeconds }
    }).sort({ createdAt: -1 });

    return session;
  }

  /**
   * Get a fun message based on venue type
   */
  static getVenueMessage(venueType, venueName) {
    const messages = {
      fast_food: [
        `🍔 Cheers! Enjoy your meal at ${venueName || 'the restaurant'}!`,
        `🍟 Fuel up! You've earned it after that hike!`,
        `🥤 Refuel time! Great workout, now great food!`
      ],
      cafe: [
        `☕ Coffee break! You've earned this after hiking together!`,
        `🧁 Treat yourselves! Nothing like post-hike coffee!`,
        `☕ Cheers to hiking buddies and good coffee!`
      ],
      restaurant: [
        `🍽️ Sit down and celebrate! You crushed that hike!`,
        `🥂 Cheers to you and your hiking buddy!`,
        `🍝 A proper meal for proper hikers! Enjoy!`
      ],
      health_food: [
        `🥗 Healthy choice! Your body thanks you!`,
        `🥑 Smart refuel! Avocado everything!`,
        `🥗 Healthy hikers, healthy food! Double bonus!`
      ],
      brewery: [
        `🍺 Post-hike beers are the best beers! Cheers!`,
        `🍻 You hiked, you earned it! Prost!`,
        `🍺 Brewery stop approved! Enjoy responsibly!`
      ],
      ice_cream: [
        `🍦 Treat yourselves! You deserve it!`,
        `🍨 Ice cream is always the answer!`,
        `🍦 Sweet reward for sweet hikers!`
      ],
      other: [
        `🍽️ Cheers! Enjoy your meal together!`,
        `🥂 Great hike, great company! Enjoy!`,
        `🎉 Rest up! You've earned it!`
      ]
    };

    const typeMessages = messages[venueType] || messages.other;
    return typeMessages[Math.floor(Math.random() * typeMessages.length)];
  }

  /**
   * Find nearby friends who are also resting (for discovery feature)
   */
  static async findNearbyRestingFriends(userId, location, radiusMeters = 100) {
    try {
      // Get users with active sessions who are currently stopped
      // This would integrate with real-time location sharing in a production app

      // For now, return empty - this would be implemented with real-time location
      return {
        success: true,
        nearbyFriends: []
      };
    } catch (error) {
      logger.error('Error finding nearby friends:', error);
      return { success: false, nearbyFriends: [] };
    }
  }

  /**
   * Get user's rest stop bonus history
   */
  static async getBonusHistory(userId, limit = 10) {
    try {
      const bonuses = await RestStopBonus.find({
        'users.userId': userId,
        status: 'awarded'
      })
        .sort({ awardedAt: -1 })
        .limit(limit)
        .populate('users.userId', 'username');

      return {
        success: true,
        bonuses: bonuses.map(b => ({
          id: b._id,
          venue: b.venue.name,
          venueType: b.venue.type,
          bonus: b.users.find(u => u.userId._id?.toString() === userId || u.userId.toString() === userId)?.bonusReceived || 0,
          friend: b.users.find(u => (u.userId._id?.toString() || u.userId.toString()) !== userId)?.userId?.username || 'Unknown',
          message: b.message,
          date: b.awardedAt
        }))
      };
    } catch (error) {
      logger.error('Error getting bonus history:', error);
      return { success: false, bonuses: [] };
    }
  }
}

module.exports = RestStopService;
