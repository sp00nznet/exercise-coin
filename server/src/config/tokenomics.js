/**
 * 🎰 Exercise Coin Tokenomics Configuration
 *
 * Based on F7CoinV4 parameters:
 * - Block Reward: 77 EXC
 * - Total Supply: 200,000,000 EXC
 * - Block Time: 30 seconds
 * - Halving: Every 840,000 blocks (~292 days)
 */

const TOKENOMICS = {
  // ⛏️ Core blockchain parameters
  BLOCKCHAIN: {
    BLOCK_REWARD: 77,
    BLOCK_TIME_SECONDS: 30,
    TOTAL_SUPPLY: 200_000_000,
    HALVING_INTERVAL: 840_000,
    ALGORITHM: 'scrypt'
  },

  // 🏃 Exercise Mining
  // 30 min exercise = 15 min mining time = ~77 coins (one block equivalent)
  EXERCISE_MINING: {
    MINING_RATIO: 0.5,                    // 50% of exercise time = mining time
    COINS_PER_MINING_MINUTE: 5.13,        // 77 ÷ 15 = 5.13 EXC per minute
    MIN_EXERCISE_SECONDS: 60,             // Minimum exercise to trigger mining
    MAX_MINING_MINUTES_PER_SESSION: 60,   // Cap at 1 hour mining per session
  },

  // 🎁 Random Treasure Drops (Weekly - Sundays)
  RANDOM_DROPS: {
    MINING_MINUTES: 30,                   // Mine for 30 minutes
    DROPS_PER_WEEK: 25,                   // 25 drops spread across locations
    EXPIRY_DAYS: 14,                      // Drops expire after 2 weeks

    // 🎰 Tiered drop system - GENEROUS with big jackpots!
    TIERS: {
      COMMON: {
        chance: 0.55,                     // 55% of drops
        minAmount: 5,
        maxAmount: 25,
        label: '🥉 Common',
        message: 'Nice find! Keep moving!'
      },
      RARE: {
        chance: 0.25,                     // 25% of drops
        minAmount: 30,
        maxAmount: 77,                    // Up to one full block!
        label: '🥈 Rare',
        message: 'Great discovery! 🎉'
      },
      EPIC: {
        chance: 0.12,                     // 12% of drops
        minAmount: 100,
        maxAmount: 300,
        label: '🥇 Epic',
        message: 'WOW! Epic treasure! 🌟'
      },
      LEGENDARY: {
        chance: 0.08,                     // 8% of drops - more generous!
        minAmount: 500,
        maxAmount: 1000,
        label: '💎 LEGENDARY',
        message: '🏆 JACKPOT! LEGENDARY FIND! 🏆'
      }
    }
  },

  // 🤗 Friendliness Bonus (Weekly - Saturdays)
  FRIENDLINESS: {
    MINING_MINUTES: 30,
    BONUS_CHANCE: 0.35,                   // 35% chance (slightly increased)
    MIN_BONUS: 10,                        // Minimum 10 EXC
    MAX_BONUS: 77,                        // Up to a full block!

    // Bonus multiplier based on transfer amount
    MULTIPLIERS: {
      SMALL: { maxTransfer: 10, multiplier: 1.0 },
      MEDIUM: { maxTransfer: 50, multiplier: 1.5 },
      LARGE: { maxTransfer: 100, multiplier: 2.0 },
      WHALE: { maxTransfer: Infinity, multiplier: 3.0 }
    }
  },

  // 🍔 Rest Stop Bonus (Real-time detection)
  REST_STOP: {
    ENABLED: true,
    MIN_EXERCISE_MINUTES: 15,             // Must have 15+ min of exercise first
    MIN_REST_MINUTES: 5,                  // Must be stopped 5+ minutes
    MAX_REST_MINUTES: 60,                 // Bonus expires after 1 hour rest
    VENUE_RADIUS_METERS: 50,              // Must be within 50m of venue

    // Bonus amounts
    MIN_BONUS: 5,
    MAX_BONUS: 25,

    // Venue type multipliers
    VENUE_MULTIPLIERS: {
      fast_food: 1.0,                     // Subway, McDonald's, etc.
      cafe: 1.2,                          // Coffee shops
      restaurant: 1.5,                    // Sit-down restaurants
      health_food: 2.0,                   // Healthy eating bonus!
      brewery: 1.3,                       // Post-hike beer!
      ice_cream: 1.1                      // Treat yourself!
    },

    // Cooldown to prevent abuse
    COOLDOWN_HOURS: 4                     // One rest stop bonus per 4 hours
  },

  // 🏆 Achievement Rewards
  ACHIEVEMENTS: {
    // Coin rewards for achievements
    REWARDS: {
      BADGE_ONLY: 0,
      SMALL: 10,
      MEDIUM: 25,
      LARGE: 77,                          // One block!
      EPIC: 200,
      LEGENDARY: 500
    }
  },

  // 💱 Exchange (for reference, actual rates set by admin)
  EXCHANGE: {
    MIN_TRADE_AMOUNT: 1,                  // Minimum 1 EXC per trade
    MAX_TRADE_AMOUNT: 10000,              // Maximum 10,000 EXC per trade
    TRADE_FEE_PERCENT: 1.0,               // 1% trading fee
    WITHDRAWAL_FEE_PERCENT: 0.5           // 0.5% withdrawal fee
  }
};

/**
 * Get a random tier based on chances
 */
function getRandomTier() {
  const roll = Math.random();
  let cumulative = 0;

  for (const [tierName, tier] of Object.entries(TOKENOMICS.RANDOM_DROPS.TIERS)) {
    cumulative += tier.chance;
    if (roll < cumulative) {
      return { name: tierName, ...tier };
    }
  }

  // Fallback to common
  return { name: 'COMMON', ...TOKENOMICS.RANDOM_DROPS.TIERS.COMMON };
}

/**
 * Get random amount for a tier
 */
function getRandomAmountForTier(tier) {
  const range = tier.maxAmount - tier.minAmount;
  const amount = tier.minAmount + Math.random() * range;
  return Math.round(amount * 100) / 100;
}

/**
 * Calculate friendliness bonus multiplier
 */
function getFriendlinessMultiplier(transferAmount) {
  const multipliers = TOKENOMICS.FRIENDLINESS.MULTIPLIERS;

  if (transferAmount <= multipliers.SMALL.maxTransfer) return multipliers.SMALL.multiplier;
  if (transferAmount <= multipliers.MEDIUM.maxTransfer) return multipliers.MEDIUM.multiplier;
  if (transferAmount <= multipliers.LARGE.maxTransfer) return multipliers.LARGE.multiplier;
  return multipliers.WHALE.multiplier;
}

/**
 * Calculate mining reward for exercise session
 */
function calculateMiningReward(exerciseSeconds) {
  const miningMinutes = (exerciseSeconds * TOKENOMICS.EXERCISE_MINING.MINING_RATIO) / 60;
  const cappedMinutes = Math.min(miningMinutes, TOKENOMICS.EXERCISE_MINING.MAX_MINING_MINUTES_PER_SESSION);
  const reward = cappedMinutes * TOKENOMICS.EXERCISE_MINING.COINS_PER_MINING_MINUTE;
  return Math.round(reward * 100) / 100;
}

module.exports = {
  TOKENOMICS,
  getRandomTier,
  getRandomAmountForTier,
  getFriendlinessMultiplier,
  calculateMiningReward
};
