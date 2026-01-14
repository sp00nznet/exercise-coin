const User = require('../models/User');
const ExerciseSession = require('../models/ExerciseSession');
const Transaction = require('../models/Transaction');
const CoinDaemonService = require('../services/CoinDaemonService');
const logger = require('../utils/logger');

// Admin authentication check
exports.verifyAdmin = async (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];

  if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid admin key' });
  }

  next();
};

// Dashboard overview
exports.getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // User stats
    const totalUsers = await User.countDocuments();
    const activeUsersToday = await User.countDocuments({ lastActiveAt: { $gte: today } });
    const activeUsersWeek = await User.countDocuments({ lastActiveAt: { $gte: weekAgo } });
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: today } });
    const newUsersWeek = await User.countDocuments({ createdAt: { $gte: weekAgo } });

    // Session stats
    const totalSessions = await ExerciseSession.countDocuments();
    const sessionsToday = await ExerciseSession.countDocuments({ createdAt: { $gte: today } });
    const rewardedSessions = await ExerciseSession.countDocuments({ status: 'rewarded' });
    const invalidSessions = await ExerciseSession.countDocuments({ status: 'invalid' });

    // Mining stats
    const activeDaemons = CoinDaemonService.activeDaemons.size;
    const miningDaemons = Array.from(CoinDaemonService.activeDaemons.values())
      .filter(d => d.miningActive).length;

    // Coin stats
    const totalCoinsEarned = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$totalCoinsEarned' } } }
    ]);
    const coinsEarnedToday = await Transaction.aggregate([
      { $match: { type: 'mining_reward', createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Exercise stats
    const totalExerciseTime = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$totalExerciseSeconds' } } }
    ]);
    const totalSteps = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$totalSteps' } } }
    ]);

    res.json({
      users: {
        total: totalUsers,
        activeToday: activeUsersToday,
        activeWeek: activeUsersWeek,
        newToday: newUsersToday,
        newWeek: newUsersWeek
      },
      sessions: {
        total: totalSessions,
        today: sessionsToday,
        rewarded: rewardedSessions,
        invalid: invalidSessions,
        successRate: totalSessions > 0
          ? ((rewardedSessions / totalSessions) * 100).toFixed(1)
          : 0
      },
      mining: {
        activeDaemons,
        currentlyMining: miningDaemons,
        totalCoinsDistributed: totalCoinsEarned[0]?.total || 0,
        coinsDistributedToday: coinsEarnedToday[0]?.total || 0
      },
      exercise: {
        totalTimeHours: Math.round((totalExerciseTime[0]?.total || 0) / 3600),
        totalSteps: totalSteps[0]?.total || 0
      },
      timestamp: new Date()
    });

  } catch (error) {
    next(error);
  }
};

// Get all users with pagination
exports.getUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = '-createdAt',
      search = '',
      status = ''
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { username: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    if (status === 'active') {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      query.lastActiveAt = { $gte: dayAgo };
    }

    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get single user details
exports.getUserDetails = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's sessions
    const recentSessions = await ExerciseSession.find({ userId })
      .sort('-createdAt')
      .limit(10)
      .select('-stepData');

    // Get user's transactions
    const recentTransactions = await Transaction.find({ userId })
      .sort('-createdAt')
      .limit(10);

    // Get daemon status
    const daemonStatus = CoinDaemonService.getDaemonStatus(userId);

    // Session stats
    const sessionStats = await ExerciseSession.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalSteps: { $sum: '$totalSteps' },
          totalDuration: { $sum: '$durationSeconds' }
        }
      }
    ]);

    res.json({
      user,
      daemonStatus,
      recentSessions,
      recentTransactions,
      sessionStats
    });

  } catch (error) {
    next(error);
  }
};

// Get active miners
exports.getActiveMiners = async (req, res, next) => {
  try {
    const daemons = Array.from(CoinDaemonService.activeDaemons.entries());

    const minerDetails = await Promise.all(
      daemons.map(async ([userId, daemon]) => {
        const user = await User.findById(userId).select('username email totalCoinsEarned');
        return {
          userId,
          username: user?.username || 'Unknown',
          email: user?.email || 'Unknown',
          status: daemon.status,
          port: daemon.port,
          miningActive: daemon.miningActive,
          miningStartedAt: daemon.miningStartedAt,
          miningDuration: daemon.miningDuration,
          walletAddress: daemon.walletAddress,
          startedAt: daemon.startedAt,
          totalCoinsEarned: user?.totalCoinsEarned || 0
        };
      })
    );

    res.json({
      total: minerDetails.length,
      currentlyMining: minerDetails.filter(m => m.miningActive).length,
      miners: minerDetails
    });

  } catch (error) {
    next(error);
  }
};

// Get mining performance metrics
exports.getMiningMetrics = async (req, res, next) => {
  try {
    const { period = '7d' } = req.query;

    let startDate = new Date();
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
    }

    // Daily mining stats
    const dailyStats = await Transaction.aggregate([
      {
        $match: {
          type: 'mining_reward',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalCoins: { $sum: '$amount' },
          transactions: { $sum: 1 },
          avgCoinsPerTx: { $avg: '$amount' },
          totalMiningTime: { $sum: '$miningDurationSeconds' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Hourly distribution (for 24h view)
    const hourlyStats = period === '24h' ? await Transaction.aggregate([
      {
        $match: {
          type: 'mining_reward',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          totalCoins: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]) : [];

    // Top miners
    const topMiners = await Transaction.aggregate([
      {
        $match: {
          type: 'mining_reward',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalCoins: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { totalCoins: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          username: '$user.username',
          totalCoins: 1,
          transactions: 1
        }
      }
    ]);

    res.json({
      period,
      startDate,
      dailyStats,
      hourlyStats,
      topMiners,
      summary: {
        totalCoins: dailyStats.reduce((sum, d) => sum + d.totalCoins, 0),
        totalTransactions: dailyStats.reduce((sum, d) => sum + d.transactions, 0),
        avgCoinsPerDay: dailyStats.length > 0
          ? (dailyStats.reduce((sum, d) => sum + d.totalCoins, 0) / dailyStats.length).toFixed(2)
          : 0
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get exercise metrics
exports.getExerciseMetrics = async (req, res, next) => {
  try {
    const { period = '7d' } = req.query;

    let startDate = new Date();
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
    }

    // Daily exercise stats
    const dailyStats = await ExerciseSession.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sessions: { $sum: 1 },
          totalSteps: { $sum: '$totalSteps' },
          totalDuration: { $sum: '$durationSeconds' },
          rewarded: { $sum: { $cond: [{ $eq: ['$status', 'rewarded'] }, 1, 0] } },
          invalid: { $sum: { $cond: [{ $eq: ['$status', 'invalid'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Invalid reason breakdown
    const invalidReasons = await ExerciseSession.aggregate([
      {
        $match: {
          status: 'invalid',
          createdAt: { $gte: startDate },
          invalidReason: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$invalidReason',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      period,
      startDate,
      dailyStats,
      invalidReasons,
      summary: {
        totalSessions: dailyStats.reduce((sum, d) => sum + d.sessions, 0),
        totalSteps: dailyStats.reduce((sum, d) => sum + d.totalSteps, 0),
        totalHours: Math.round(dailyStats.reduce((sum, d) => sum + d.totalDuration, 0) / 3600),
        successRate: dailyStats.length > 0
          ? ((dailyStats.reduce((sum, d) => sum + d.rewarded, 0) /
              dailyStats.reduce((sum, d) => sum + d.sessions, 0)) * 100).toFixed(1)
          : 0
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get recent sessions
exports.getRecentSessions = async (req, res, next) => {
  try {
    const { limit = 50, status = '' } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const sessions = await ExerciseSession.find(query)
      .sort('-createdAt')
      .limit(parseInt(limit))
      .select('-stepData')
      .populate('userId', 'username email');

    res.json({ sessions });

  } catch (error) {
    next(error);
  }
};

// Get system logs (last N entries)
exports.getLogs = async (req, res, next) => {
  try {
    const { level = 'all', limit = 100 } = req.query;

    // In a real implementation, you'd read from your log files or log aggregation service
    // For now, return a placeholder with system info
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };

    res.json({
      logs: [
        { level: 'info', message: 'Log streaming available via WebSocket', timestamp: new Date() }
      ],
      systemInfo,
      note: 'For full logs, check server logs via docker-compose logs or PM2 logs'
    });

  } catch (error) {
    next(error);
  }
};

// Get system health
exports.getSystemHealth = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');

    // Check MongoDB
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    // Check daemon service
    const daemonServiceStatus = CoinDaemonService ? 'running' : 'error';

    // Memory usage
    const memUsage = process.memoryUsage();

    res.json({
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      services: {
        database: dbStatus,
        daemonService: daemonServiceStatus
      },
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB'
      },
      activeDaemons: CoinDaemonService.activeDaemons.size
    });

  } catch (error) {
    next(error);
  }
};
