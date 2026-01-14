const User = require('../models/User');
const Transaction = require('../models/Transaction');
const CoinDaemonService = require('../services/CoinDaemonService');
const logger = require('../utils/logger');

exports.getBalance = async (req, res, next) => {
  try {
    const userId = req.userId;

    const balance = await CoinDaemonService.getWalletBalance(userId);

    res.json({
      balance: balance.balance,
      pending: balance.pending,
      walletAddress: balance.walletAddress
    });

  } catch (error) {
    next(error);
  }
};

exports.getWalletAddress = async (req, res, next) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.walletAddress) {
      // Initialize daemon to generate wallet address
      await CoinDaemonService.initializeUserDaemon(userId);
      await user.reload();
    }

    res.json({
      walletAddress: user.walletAddress,
      daemonStatus: user.daemonStatus
    });

  } catch (error) {
    next(error);
  }
};

exports.getTransactions = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { limit = 50, offset = 0, type } = req.query;

    const query = { userId };
    if (type) {
      query.type = type;
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + transactions.length < total
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.getTransaction = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { transactionId } = req.params;

    const transaction = await Transaction.findOne({
      _id: transactionId,
      userId
    }).populate('exerciseSessionId');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction });

  } catch (error) {
    next(error);
  }
};

exports.getDaemonStatus = async (req, res, next) => {
  try {
    const userId = req.userId;

    const status = CoinDaemonService.getDaemonStatus(userId);
    const user = await User.findById(userId);

    res.json({
      status: status.status,
      daemonPort: user?.daemonPort,
      walletAddress: user?.walletAddress,
      miningActive: status.miningActive || false
    });

  } catch (error) {
    next(error);
  }
};

exports.startDaemon = async (req, res, next) => {
  try {
    const userId = req.userId;

    const daemonInfo = await CoinDaemonService.initializeUserDaemon(userId);

    res.json({
      message: 'Daemon started',
      status: daemonInfo.status,
      walletAddress: daemonInfo.walletAddress
    });

  } catch (error) {
    next(error);
  }
};

exports.stopDaemon = async (req, res, next) => {
  try {
    const userId = req.userId;

    await CoinDaemonService.stopUserDaemon(userId);

    res.json({ message: 'Daemon stopped' });

  } catch (error) {
    next(error);
  }
};

exports.getEarningsHistory = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const earnings = await Transaction.aggregate([
      {
        $match: {
          userId: require('mongoose').Types.ObjectId(userId),
          type: 'mining_reward',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          totalCoins: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      earnings,
      period: {
        startDate,
        endDate: new Date(),
        days: parseInt(days)
      }
    });

  } catch (error) {
    next(error);
  }
};
