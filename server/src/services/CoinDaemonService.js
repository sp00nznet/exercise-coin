const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const logger = require('../utils/logger');
const User = require('../models/User');
const { TOKENOMICS, calculateMiningReward } = require('../config/tokenomics');

const execAsync = promisify(exec);

class CoinDaemonService {
  constructor() {
    // Exercise Coin unique ports: Mainnet RPC=39338, P2P=39339
    this.basePort = parseInt(process.env.COIN_DAEMON_PORT) || 39338;
    this.daemonHost = process.env.COIN_DAEMON_HOST || 'localhost';
    this.rpcUser = process.env.COIN_DAEMON_USER || 'exercisecoin';
    this.rpcPass = process.env.COIN_DAEMON_PASS || 'password';
    this.activeDaemons = new Map(); // userId -> daemon info
    this.portPool = new Set(); // Track allocated ports
  }

  async allocatePort() {
    let port = this.basePort + 1;
    while (this.portPool.has(port)) {
      port++;
    }
    this.portPool.add(port);
    return port;
  }

  releasePort(port) {
    this.portPool.delete(port);
  }

  async initializeUserDaemon(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if daemon already running
      if (this.activeDaemons.has(userId.toString())) {
        const existing = this.activeDaemons.get(userId.toString());
        if (existing.status === 'running') {
          return existing;
        }
      }

      // Allocate port for this user's daemon
      const port = user.daemonPort || await this.allocatePort();

      // Update user with daemon info
      user.daemonPort = port;
      user.daemonStatus = 'starting';
      await user.save();

      // Generate wallet address if not exists
      if (!user.walletAddress) {
        const walletAddress = await this.generateWalletAddress(userId, port);
        user.walletAddress = walletAddress;
        await user.save();
      }

      const daemonInfo = {
        userId: userId.toString(),
        port,
        status: 'running',
        walletAddress: user.walletAddress,
        startedAt: new Date(),
        miningActive: false
      };

      this.activeDaemons.set(userId.toString(), daemonInfo);

      user.daemonStatus = 'running';
      await user.save();

      logger.info(`Daemon initialized for user ${userId} on port ${port}`);
      return daemonInfo;

    } catch (error) {
      logger.error(`Failed to initialize daemon for user ${userId}:`, error);
      throw error;
    }
  }

  async generateWalletAddress(userId, port) {
    // In production, this would call the actual coin daemon RPC
    // For now, generate a deterministic address based on userId
    // Exercise Coin addresses start with 'E' (base58 prefix 33)
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256')
      .update(`exercise-coin-${userId}-${Date.now()}`)
      .digest('hex');
    return `E${hash.substring(0, 33)}`;
  }

  async startMining(userId, durationSeconds) {
    try {
      const daemon = this.activeDaemons.get(userId.toString());
      if (!daemon) {
        await this.initializeUserDaemon(userId);
      }

      const daemonInfo = this.activeDaemons.get(userId.toString());
      daemonInfo.miningActive = true;
      daemonInfo.miningStartedAt = new Date();
      daemonInfo.miningDuration = durationSeconds;

      logger.info(`Mining started for user ${userId} for ${durationSeconds} seconds`);

      // Simulate mining process
      // In production, this would call the actual coin daemon RPC to start mining
      const miningResult = await this.executeMining(userId, durationSeconds);

      daemonInfo.miningActive = false;

      return miningResult;

    } catch (error) {
      logger.error(`Mining failed for user ${userId}:`, error);
      throw error;
    }
  }

  async executeMining(userId, durationSeconds) {
    // Simulate mining execution
    // In production, this would:
    // 1. Call setgenerate true 1 on the user's daemon
    // 2. Wait for durationSeconds
    // 3. Call setgenerate false
    // 4. Check for any mined blocks/rewards

    return new Promise((resolve) => {
      setTimeout(() => {
        // Mining reward calculation based on F7CoinV4 tokenomics:
        // - Block Reward: 77 EXC
        // - Block Time: 30 seconds
        // - Mining time = 50% of exercise time
        // - ~5.13 EXC per minute of mining (77 / 15 minutes)

        const { BLOCKCHAIN, EXERCISE_MINING } = TOKENOMICS;
        const miningMinutes = durationSeconds / 60;

        // Calculate base reward using tokenomics formula
        // This ensures consistent rewards based on exercise duration
        const baseReward = miningMinutes * EXERCISE_MINING.COINS_PER_MINING_MINUTE;

        // Add small random variance (+-10%) to make it feel more natural
        const variance = 0.9 + (Math.random() * 0.2);
        const coinsEarned = Math.round(baseReward * variance * 100) / 100;

        // Calculate equivalent blocks found
        const blocksFound = coinsEarned / BLOCKCHAIN.BLOCK_REWARD;

        const result = {
          success: true,
          durationSeconds,
          miningMinutes: Math.round(miningMinutes * 100) / 100,
          coinsEarned,
          blocksFound: Math.round(blocksFound * 1000) / 1000,
          blockReward: BLOCKCHAIN.BLOCK_REWARD,
          timestamp: new Date()
        };

        logger.info(`Mining completed for user ${userId}: ${coinsEarned} EXC earned (${miningMinutes.toFixed(2)} min mining time)`);
        resolve(result);
      }, Math.min(durationSeconds * 100, 5000)); // Simulate with max 5 second delay
    });
  }

  async getWalletBalance(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.walletAddress) {
        return { balance: 0, pending: 0 };
      }

      // In production, call daemon RPC getbalance
      // For now, return from user record
      return {
        balance: user.totalCoinsEarned,
        pending: 0,
        walletAddress: user.walletAddress
      };

    } catch (error) {
      logger.error(`Failed to get wallet balance for user ${userId}:`, error);
      throw error;
    }
  }

  async getTransactionHistory(userId, limit = 50) {
    const Transaction = require('../models/Transaction');
    return Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async stopUserDaemon(userId) {
    const daemon = this.activeDaemons.get(userId.toString());
    if (daemon) {
      if (daemon.port) {
        this.releasePort(daemon.port);
      }
      this.activeDaemons.delete(userId.toString());

      await User.findByIdAndUpdate(userId, { daemonStatus: 'stopped' });
      logger.info(`Daemon stopped for user ${userId}`);
    }
  }

  getDaemonStatus(userId) {
    return this.activeDaemons.get(userId.toString()) || { status: 'inactive' };
  }
}

module.exports = new CoinDaemonService();
