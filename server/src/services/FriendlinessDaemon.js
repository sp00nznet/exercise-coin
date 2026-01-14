const FriendlyTransfer = require('../models/FriendlyTransfer');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');
const { TOKENOMICS, getFriendlinessMultiplier } = require('../config/tokenomics');

class FriendlinessDaemon {
  static isRunning = false;
  static lastRunTime = null;
  static intervalId = null;

  /**
   * Initialize the daemon scheduler
   * Runs every Saturday at midnight UTC (day before treasure drops)
   */
  static initialize() {
    this.intervalId = setInterval(() => {
      this.checkAndRun();
    }, 60 * 60 * 1000);

    this.checkAndRun();
    logger.info('🤗 FriendlinessDaemon initialized - weekly friendliness bonuses enabled');
  }

  /**
   * Check if it's time to run and execute if so
   */
  static async checkAndRun() {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 6 = Saturday
    const hour = now.getUTCHours();

    if (dayOfWeek === 6 && hour === 0) {
      if (this.lastRunTime) {
        const hoursSinceLastRun = (now - this.lastRunTime) / (1000 * 60 * 60);
        if (hoursSinceLastRun < 24) return;
      }
      await this.run();
    }
  }

  /**
   * Manually trigger a run (for testing or admin use)
   */
  static async run() {
    if (this.isRunning) {
      logger.warn('FriendlinessDaemon is already running');
      return { success: false, error: 'Already running' };
    }

    this.isRunning = true;
    this.lastRunTime = new Date();

    logger.info('🤗 FriendlinessDaemon starting weekly friendliness bonus distribution...');

    try {
      // Mine for bonus coins
      const miningResult = await this.mineForBonuses();

      if (!miningResult.success || miningResult.coinsEarned <= 0) {
        logger.info('FriendlinessDaemon: No coins mined for bonuses');
        this.isRunning = false;
        return { success: true, bonuses: 0, totalCoins: 0 };
      }

      const totalCoins = miningResult.coinsEarned;
      logger.info(`⛏️ Mined ${totalCoins} EXC for friendliness bonuses`);

      // Get eligible transfers from this week
      const eligibleTransfers = await this.getEligibleTransfers();

      if (eligibleTransfers.length === 0) {
        logger.info('FriendlinessDaemon: No eligible friendly transfers this week');
        this.isRunning = false;
        return { success: true, bonuses: 0, totalCoins: 0 };
      }

      logger.info(`📋 Found ${eligibleTransfers.length} eligible friendly transfers`);

      // Distribute bonuses randomly
      const bonuses = await this.distributeBonuses(eligibleTransfers, totalCoins);

      logger.info(`🎁 FriendlinessDaemon completed: ${bonuses.length} bonuses awarded`);

      this.isRunning = false;
      return { success: true, bonuses: bonuses.length, totalCoins };
    } catch (error) {
      logger.error('FriendlinessDaemon error:', error);
      this.isRunning = false;
      return { success: false, error: error.message };
    }
  }

  /**
   * Mine coins for friendliness bonuses
   */
  static async mineForBonuses() {
    try {
      const miningMinutes = TOKENOMICS.FRIENDLINESS.MINING_MINUTES;
      const coinsPerMinute = TOKENOMICS.EXERCISE_MINING.COINS_PER_MINING_MINUTE;
      const coinsEarned = miningMinutes * coinsPerMinute;

      logger.info(`⛏️ Mining for ${miningMinutes} minutes at ${coinsPerMinute} EXC/min`);

      return {
        success: true,
        coinsEarned: Math.round(coinsEarned * 100) / 100
      };
    } catch (error) {
      logger.error('Mining for bonuses failed:', error);
      return { success: false, coinsEarned: 0 };
    }
  }

  /**
   * Get transfers from this week that are eligible for bonuses
   */
  static async getEligibleTransfers() {
    const now = new Date();
    const weekNumber = this.getWeekNumber(now);
    const year = now.getFullYear();

    const transfers = await FriendlyTransfer.find({
      weekNumber,
      year,
      bonusAwarded: false
    }).populate('fromUserId', 'username').populate('toUserId', 'username');

    return transfers;
  }

  /**
   * Distribute bonus coins to eligible transfers
   */
  static async distributeBonuses(eligibleTransfers, totalCoins) {
    const bonuses = [];
    const bonusChance = TOKENOMICS.FRIENDLINESS.BONUS_CHANCE;
    const minBonus = TOKENOMICS.FRIENDLINESS.MIN_BONUS;
    const maxBonus = TOKENOMICS.FRIENDLINESS.MAX_BONUS;

    for (const transfer of eligibleTransfers) {
      // Each transfer has a chance to win
      if (Math.random() < bonusChance) {
        // Get multiplier based on transfer amount
        const multiplier = getFriendlinessMultiplier(transfer.transferAmount);

        // Calculate bonus amount
        let baseBonus = minBonus + Math.random() * (maxBonus - minBonus);
        let bonusAmount = Math.min(baseBonus * multiplier, totalCoins / eligibleTransfers.length * 3);
        bonusAmount = Math.round(bonusAmount * 100) / 100;

        if (bonusAmount < 1) continue;

        // Award bonus to BOTH users equally!
        const bonusPerUser = Math.round((bonusAmount / 2) * 100) / 100;

        try {
          // Update both users' balances
          await Promise.all([
            User.findByIdAndUpdate(transfer.fromUserId._id || transfer.fromUserId, {
              $inc: { totalCoinsEarned: bonusPerUser }
            }),
            User.findByIdAndUpdate(transfer.toUserId._id || transfer.toUserId, {
              $inc: { totalCoinsEarned: bonusPerUser }
            })
          ]);

          // Create transaction records
          await Promise.all([
            Transaction.create({
              userId: transfer.fromUserId._id || transfer.fromUserId,
              type: 'mining_reward',
              amount: bonusPerUser,
              status: 'confirmed',
              confirmedAt: new Date(),
              metadata: {
                type: 'friendliness_bonus',
                friendlyTransferId: transfer._id,
                tradedWith: transfer.toUserId.username || 'Unknown',
                originalTransferAmount: transfer.transferAmount,
                multiplier
              }
            }),
            Transaction.create({
              userId: transfer.toUserId._id || transfer.toUserId,
              type: 'mining_reward',
              amount: bonusPerUser,
              status: 'confirmed',
              confirmedAt: new Date(),
              metadata: {
                type: 'friendliness_bonus',
                friendlyTransferId: transfer._id,
                tradedWith: transfer.fromUserId.username || 'Unknown',
                originalTransferAmount: transfer.transferAmount,
                multiplier
              }
            })
          ]);

          // Mark transfer as bonus awarded
          transfer.bonusAwarded = true;
          transfer.bonusAmount = bonusAmount;
          transfer.bonusAwardedAt = new Date();
          await transfer.save();

          bonuses.push({
            transferId: transfer._id,
            fromUser: transfer.fromUserId.username || transfer.fromUserId,
            toUser: transfer.toUserId.username || transfer.toUserId,
            originalAmount: transfer.transferAmount,
            bonusAmount,
            bonusPerUser,
            multiplier
          });

          logger.info(`🤗 Friendliness bonus: ${bonusAmount} EXC (${bonusPerUser} each) for transfer of ${transfer.transferAmount} EXC (${multiplier}x multiplier)`);
        } catch (error) {
          logger.error(`Failed to award bonus for transfer ${transfer._id}:`, error);
        }
      }
    }

    return bonuses;
  }

  /**
   * Record a friendly transfer (called when transfer happens between two hiking users)
   */
  static async recordFriendlyTransfer(transferData) {
    try {
      const now = new Date();
      const weekNumber = this.getWeekNumber(now);
      const year = now.getFullYear();

      const friendlyTransfer = new FriendlyTransfer({
        transferId: transferData.transferId,
        fromUserId: transferData.fromUserId,
        toUserId: transferData.toUserId,
        transferAmount: transferData.amount,
        fromUserSessionId: transferData.fromSessionId,
        toUserSessionId: transferData.toSessionId,
        location: transferData.location ? {
          type: 'Point',
          coordinates: [transferData.location.longitude, transferData.location.latitude]
        } : undefined,
        weekNumber,
        year
      });

      await friendlyTransfer.save();

      logger.info(`🤝 Recorded friendly transfer: ${transferData.amount} EXC between hiking buddies!`);

      return { success: true, friendlyTransfer };
    } catch (error) {
      logger.error('Error recording friendly transfer:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get ISO week number
   */
  static getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  /**
   * Get daemon status
   */
  static getStatus() {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      config: TOKENOMICS.FRIENDLINESS,
      nextScheduledRun: this.getNextScheduledRun()
    };
  }

  /**
   * Calculate next scheduled run time
   */
  static getNextScheduledRun() {
    const now = new Date();
    const daysUntilSaturday = (6 - now.getUTCDay() + 7) % 7;
    const nextSaturday = new Date(now);
    nextSaturday.setUTCDate(now.getUTCDate() + (daysUntilSaturday || 7));
    nextSaturday.setUTCHours(0, 0, 0, 0);
    return nextSaturday;
  }

  /**
   * Stop the daemon
   */
  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    logger.info('FriendlinessDaemon stopped');
  }
}

module.exports = FriendlinessDaemon;
