const RestStopBonus = require('../models/RestStopBonus');
const ExerciseSession = require('../models/ExerciseSession');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');
const { TOKENOMICS } = require('../config/tokenomics');

/**
 * 🥗 Rest Stop Service
 *
 * Detects when hiking friends stop at restaurants/cafes together
 * and awards bonus coins. HEALTHY CHOICES = BIGGER BONUSES!
 * 🥗 Salad > 🍔 Burger
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

      // Get venue type multiplier - healthy choices get bigger bonuses!
      const venueType = venueInfo?.type || 'default';
      const venueMultiplier = config.VENUE_MULTIPLIERS[venueType] || config.VENUE_MULTIPLIERS.default || 0.8;

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
   * HEALTHY = Encouraging, UNHEALTHY = Gentle nudge
   */
  static getVenueMessage(venueType, venueName) {
    const messages = {
      // 🟢 HEALTHY OPTIONS - Celebrate!
      health_food: [
        `🥗 AMAZING CHOICE! Healthy food after exercise = TRIPLE POINTS! 💪`,
        `🥗 YES! This is how champions refuel! Maximum bonus!`,
        `🥗 Salad squad! Your body (and wallet) thanks you!`
      ],
      juice_bar: [
        `🧃 SMART! Fresh juice = Fresh gains! Big bonus!`,
        `🍹 Liquid nutrition! Your muscles thank you!`,
        `🥤 Smoothie boost! Keep those healthy choices coming!`
      ],
      salad_bar: [
        `🥬 LEGENDARY CHOICE! Greens after gains = MAX BONUS!`,
        `🥗 Salad over burger = HUGE bonus! Smart hikers!`,
        `🥬 Your body is a temple! Excellent refuel choice!`
      ],
      vegetarian: [
        `🌱 Plant-powered hikers! BIG bonus for healthy choices!`,
        `🥦 Veggie power! Your body thanks you!`,
        `🌿 Green eating = Green earning! Nice!`
      ],
      poke_bowl: [
        `🐟 Poke perfection! Healthy AND delicious!`,
        `🍣 Fresh fish fuel! Great choice for recovery!`,
        `🥢 Bowl goals! Protein-packed and bonus-packed!`
      ],
      acai: [
        `🫐 Acai bowl crew! Antioxidant bonus activated!`,
        `🍇 Superfoods for super hikers! Big bonus!`,
        `🫐 Berry good choice! Healthy hikers win!`
      ],
      organic: [
        `🌱 Organic fuel! Premium choice = Premium bonus!`,
        `🥗 Clean eating club! Your body thanks you!`,
        `🌿 Organic goodness! This is the way!`
      ],
      mediterranean: [
        `🫒 Mediterranean magic! Heart-healthy choice!`,
        `🥙 Great choice! Olive oil and gains!`,
        `🧆 Falafel fuel! Tasty and healthy!`
      ],
      sushi: [
        `🍣 Sushi squad! Omega-3 bonus!`,
        `🥢 Raw power! Great protein choice!`,
        `🍱 Fish fuel! Your muscles approve!`
      ],
      asian: [
        `🍜 Good balance of protein and veggies!`,
        `🥡 Solid choice! Enjoy the refuel!`,
        `🍲 Warm meal, warm bonus!`
      ],

      // 🟡 MODERATE OPTIONS
      cafe: [
        `☕ Coffee break! Hydration bonus!`,
        `☕ Caffeine earned! Cheers!`,
        `🧋 Coffee fuel! Keep moving!`
      ],
      restaurant: [
        `🍽️ Sit-down meal! Choose wisely from the menu!`,
        `🥂 Cheers to you! Hope you picked something healthy!`,
        `🍽️ Enjoy! Maybe get that salad side?`
      ],
      deli: [
        `🥪 Sandwich time! Load up on veggies!`,
        `🥖 Deli stop! Choose whole grain!`,
        `🥬 Get extra lettuce on that!`
      ],

      // 🟠 TREAT YOURSELF - Smaller bonuses
      brewery: [
        `🍺 Post-hike beer! You earned... a little bonus.`,
        `🍻 Brewery stop! Next time try the salad place? 😉`,
        `🍺 Cheers! But maybe grab some water too!`
      ],
      pizza: [
        `🍕 Pizza... not our best work. Small bonus!`,
        `🍕 Carb loading? There's a salad bar nearby... 😉`,
        `🍕 Pizza bonus is... modest. Try veggies next time!`
      ],
      ice_cream: [
        `🍦 Sweet treat! Tiny bonus though...`,
        `🍨 Ice cream earned... barely! 😅`,
        `🍦 Treat yourselves! (Next time try frozen yogurt?)`
      ],

      // 🔴 LESS HEALTHY - Minimal bonuses with gentle nudges
      fast_food: [
        `🍔 Fast food... small bonus. Your body deserves better!`,
        `🍟 Fries? After all that hiking? Tiny bonus!`,
        `🍔 There's a salad place next door... just saying! 🥗`
      ],
      burger: [
        `🍔 Burger bonus is... minimal. Salad next time?`,
        `🍔 Your arteries called, they want veggies! Small bonus.`,
        `🍔 Burger earned... but a salad would've been 3X! 🥗`
      ],
      fried_chicken: [
        `🍗 Fried food = fried bonus. Very small!`,
        `🍗 Your body worked hard... it deserves better fuel!`,
        `🍗 Tiny bonus! Grilled chicken next time = 5X more!`
      ],
      donut: [
        `🍩 Donuts after exercise? Minimal bonus!`,
        `🍩 Sugar crash incoming... tiny bonus!`,
        `🍩 Your workout > your food choice today! 😅`
      ],

      // Default
      default: [
        `🍽️ Cheers! Enjoy your meal together!`,
        `🥂 Great hike, great company!`,
        `🎉 Rest up! You've earned it!`
      ]
    };

    const typeMessages = messages[venueType] || messages.default;
    return typeMessages[Math.floor(Math.random() * typeMessages.length)];
  }

  /**
   * Find nearby friends who are also resting (for discovery feature)
   */
  static async findNearbyRestingFriends(_userId, _location, _radiusMeters = 100) {
    // Get users with active sessions who are currently stopped
    // This would integrate with real-time location sharing in a production app

    // For now, return empty - this would be implemented with real-time location
    return {
      success: true,
      nearbyFriends: []
    };
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
