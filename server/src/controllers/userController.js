const User = require('../models/User');
const ExerciseSession = require('../models/ExerciseSession');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { username } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (username && username !== user.username) {
      // Check if username is taken
      const existing = await User.findOne({ username });
      if (existing) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      user.username = username;
    }

    await user.save();

    res.json({
      message: 'Profile updated',
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Validate new password
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user ${userId}`);

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    next(error);
  }
};

exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get recent sessions
    const recentSessions = await ExerciseSession.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-stepData');

    // Get recent transactions
    const recentTransactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get today's summary
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySessions = await ExerciseSession.find({
      userId,
      createdAt: { $gte: today }
    });

    const todaySummary = {
      sessions: todaySessions.length,
      steps: todaySessions.reduce((sum, s) => sum + s.totalSteps, 0),
      exerciseMinutes: Math.floor(
        todaySessions.reduce((sum, s) => sum + (s.validExerciseSeconds || 0), 0) / 60
      ),
      coinsEarned: todaySessions.reduce((sum, s) => sum + (s.coinsEarned || 0), 0)
    };

    // Get weekly summary
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekSessions = await ExerciseSession.find({
      userId,
      createdAt: { $gte: weekAgo }
    });

    const weeklySummary = {
      sessions: weekSessions.length,
      steps: weekSessions.reduce((sum, s) => sum + s.totalSteps, 0),
      exerciseMinutes: Math.floor(
        weekSessions.reduce((sum, s) => sum + (s.validExerciseSeconds || 0), 0) / 60
      ),
      coinsEarned: weekSessions.reduce((sum, s) => sum + (s.coinsEarned || 0), 0)
    };

    res.json({
      user: {
        username: user.username,
        walletAddress: user.walletAddress,
        totalCoinsEarned: user.totalCoinsEarned,
        totalSteps: user.totalSteps,
        memberSince: user.createdAt
      },
      today: todaySummary,
      weekly: weeklySummary,
      recentSessions,
      recentTransactions
    });

  } catch (error) {
    next(error);
  }
};

exports.getLeaderboard = async (req, res, next) => {
  try {
    const { period = 'all', limit = 10 } = req.query;

    let dateFilter = {};
    if (period === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: today } };
    } else if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { createdAt: { $gte: monthAgo } };
    }

    let leaderboard;

    if (period === 'all') {
      // Use user totals for all-time leaderboard
      leaderboard = await User.find({})
        .sort({ totalCoinsEarned: -1 })
        .limit(parseInt(limit))
        .select('username totalCoinsEarned totalSteps totalExerciseSeconds');
    } else {
      // Aggregate from sessions for period-specific leaderboard
      leaderboard = await ExerciseSession.aggregate([
        { $match: { ...dateFilter, status: 'rewarded' } },
        {
          $group: {
            _id: '$userId',
            totalCoins: { $sum: '$coinsEarned' },
            totalSteps: { $sum: '$totalSteps' },
            sessionCount: { $sum: 1 }
          }
        },
        { $sort: { totalCoins: -1 } },
        { $limit: parseInt(limit) },
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
            username: '$user.username',
            totalCoinsEarned: '$totalCoins',
            totalSteps: 1,
            sessionCount: 1
          }
        }
      ]);
    }

    res.json({
      leaderboard,
      period
    });

  } catch (error) {
    next(error);
  }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { password } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Password is incorrect' });
    }

    // Delete user data
    await ExerciseSession.deleteMany({ userId });
    await Transaction.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    logger.info(`Account deleted for user ${userId}`);

    res.json({ message: 'Account deleted successfully' });

  } catch (error) {
    next(error);
  }
};
