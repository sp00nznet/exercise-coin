const FriendlyTransfer = require('../models/FriendlyTransfer');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

class FriendlinessDaemon {
  static isRunning = false;
  static lastRunTime = null;
  static miningDurationSeconds = 20 * 60; // 20 minutes
  static intervalId = null;
  static bonusChance = 0.3; // 30% chance of bonus when eligible

  /**
   * Initialize the daemon scheduler
   * Runs every Saturday at midnight UTC (day before treasure drops)
   */
  static initialize() {
    // Check every hour if it's time to run
    this.intervalId = setInterval(() => {
      this.checkAndRun();
    }, 60 * 60 * 1000);

    // Also check on startup
    this.checkAndRun();

    logger.info('FriendlinessDaemon initialized - will run weekly');
  }

  /**
   * Check if it's time to run and execute if so
   */
  static async checkAndRun() {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 6 = Saturday
    const hour = now.getUTCHours();

    // Run on Saturday at midnight UTC
    if (dayOfWeek === 6 && hour === 0) {
      if (this.lastRunTime) {
        const hoursSinceLastRun = (now - this.lastRunTime) / (1000 * 60 * 60);
        if (hoursSinceLastRun < 24) {
          return;
        }
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

    logger.info('FriendlinessDaemon starting weekly friendliness bonus distribution...');

    try {
      // Mine for bonus coins
      const miningResult = await this.mineForBonuses();

      if (!miningResult.success || miningResult.coinsEarned <= 0) {
        logger.info('FriendlinessDaemon: No coins mined for bonuses');
        this.isRunning = false;
        return { success: true, bonuses: 0, totalCoins: 0 };
      }

      const totalCoins = miningResult.coinsEarned;

      // Get eligible transfers from this week
      const eligibleTransfers = await this.getEligibleTransfers();

      if (eligibleTransfers.length === 0) {
        logger.info('FriendlinessDaemon: No eligible friendly transfers this week');
        this.isRunning = false;
        return { success: true, bonuses: 0, totalCoins: 0 };
      }

      // Distribute bonuses randomly
      const bonuses = await this.distributeBonuses(eligibleTransfers, totalCoins);

      logger.info(`FriendlinessDaemon completed: ${bonuses.length} bonuses totaling ${totalCoins} coins`);

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
      const estimatedCoinsPerMinute = 0.1;
      const miningMinutes = this.miningDurationSeconds / 60;
      const coinsEarned = miningMinutes * estimatedCoinsPerMinute;

      logger.info(`FriendlinessDaemon mined for ${miningMinutes} minutes, earned ~${coinsEarned} coins`);

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

    // Find all friendly transfers from this week that haven't received bonuses
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

    // Each eligible transfer has a chance to win
    for (const transfer of eligibleTransfers) {
      if (Math.random() < this.bonusChance) {
        // Calculate bonus amount (varies between 0.5x and 2x of transfer amount, capped by available coins)
        const multiplier = 0.5 + Math.random() * 1.5;
        let bonusAmount = Math.min(
          transfer.transferAmount * multiplier,
          totalCoins / eligibleTransfers.length * 2
        );
        bonusAmount = Math.round(bonusAmount * 100) / 100;

        if (bonusAmount < 0.01) continue;

        // Award bonus to BOTH users!
        const bonusPerUser = bonusAmount / 2;

        // Update both users' balances
        await Promise.all([
          User.findByIdAndUpdate(transfer.fromUserId, {
            $inc: { totalCoinsEarned: bonusPerUser }
          }),
          User.findByIdAndUpdate(transfer.toUserId, {
            $inc: { totalCoinsEarned: bonusPerUser }
          })
        ]);

        // Create transaction records
        await Promise.all([
          Transaction.create({
            userId: transfer.fromUserId,
            type: 'mining_reward',
            amount: bonusPerUser,
            status: 'confirmed',
            confirmedAt: new Date(),
            metadata: {
              type: 'friendliness_bonus',
              friendlyTransferId: transfer._id,
              tradedWith: transfer.toUserId
            }
          }),
          Transaction.create({
            userId: transfer.toUserId,
            type: 'mining_reward',
            amount: bonusPerUser,
            status: 'confirmed',
            confirmedAt: new Date(),
            metadata: {
              type: 'friendliness_bonus',
              friendlyTransferId: transfer._id,
              tradedWith: transfer.fromUserId
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
          fromUser: transfer.fromUserId,
          toUser: transfer.toUserId,
          bonusAmount
        });

        logger.info(`Friendliness bonus awarded: ${bonusAmount} EXC to transfer ${transfer._id}`);
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
        location: transferData.location,
        weekNumber,
        year
      });

      await friendlyTransfer.save();

      logger.info(`Recorded friendly transfer: ${transferData.transferId}`);

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
      miningDurationSeconds: this.miningDurationSeconds,
      bonusChance: this.bonusChance,
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
    nextSaturday.setUTCDate(now.getUTCDate() + daysUntilSaturday);
    nextSaturday.setUTCHours(0, 0, 0, 0);

    if (nextSaturday <= now) {
      nextSaturday.setUTCDate(nextSaturday.getUTCDate() + 7);
    }

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
