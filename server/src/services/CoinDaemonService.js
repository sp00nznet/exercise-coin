const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const logger = require('../utils/logger');
const User = require('../models/User');

const execAsync = promisify(exec);

class CoinDaemonService {
  constructor() {
    this.basePort = parseInt(process.env.COIN_DAEMON_PORT) || 19332;
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
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256')
      .update(`exercise-coin-${userId}-${Date.now()}`)
      .digest('hex');
    return `EXC${hash.substring(0, 34)}`;
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
        // Simulate mining results
        // In real implementation, check actual blockchain for mined blocks
        const difficulty = 1000; // Simulated network difficulty
        const hashRate = 100; // Simulated hash rate
        const blockReward = 50; // Coins per block

        // Probability of finding a block during mining window
        const blocksExpected = (hashRate * durationSeconds) / difficulty;
        const coinsEarned = Math.random() < blocksExpected ?
          blockReward * Math.floor(Math.random() * 2 + 1) : 0;

        const result = {
          success: true,
          durationSeconds,
          coinsEarned,
          blocksFound: coinsEarned > 0 ? Math.ceil(coinsEarned / blockReward) : 0,
          timestamp: new Date()
        };

        logger.info(`Mining completed for user ${userId}: ${coinsEarned} coins earned`);
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
