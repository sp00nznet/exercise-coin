const ExerciseSession = require('../models/ExerciseSession');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const ExerciseDetectionService = require('../services/ExerciseDetectionService');
const CoinDaemonService = require('../services/CoinDaemonService');
const logger = require('../utils/logger');

exports.startSession = async (req, res, next) => {
  try {
    const userId = req.userId;

    // Check for existing active session
    const activeSession = await ExerciseSession.findOne({
      userId,
      status: 'active'
    });

    if (activeSession) {
      return res.status(400).json({
        error: 'Active session already exists',
        sessionId: activeSession._id
      });
    }

    // Create new session
    const session = new ExerciseSession({
      userId,
      startTime: new Date(),
      status: 'active',
      stepData: []
    });

    await session.save();

    logger.info(`Exercise session started for user ${userId}: ${session._id}`);

    res.status(201).json({
      message: 'Exercise session started',
      sessionId: session._id,
      startTime: session.startTime
    });

  } catch (error) {
    next(error);
  }
};

exports.recordSteps = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { sessionId, stepData } = req.body;

    // Validate step data
    if (!Array.isArray(stepData) || stepData.length === 0) {
      return res.status(400).json({ error: 'Invalid step data' });
    }

    const session = await ExerciseSession.findOne({
      _id: sessionId,
      userId,
      status: 'active'
    });

    if (!session) {
      return res.status(404).json({ error: 'Active session not found' });
    }

    // Append step data
    const formattedStepData = stepData.map(d => ({
      timestamp: new Date(d.timestamp),
      stepCount: d.stepCount,
      stepsPerSecond: d.stepsPerSecond
    }));

    session.stepData.push(...formattedStepData);
    session.totalSteps = session.stepData.reduce((sum, d) => sum + d.stepCount, 0);

    await session.save();

    res.json({
      message: 'Step data recorded',
      sessionId: session._id,
      totalSteps: session.totalSteps,
      dataPoints: session.stepData.length
    });

  } catch (error) {
    next(error);
  }
};

exports.endSession = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { sessionId } = req.body;

    const session = await ExerciseSession.findOne({
      _id: sessionId,
      userId,
      status: 'active'
    });

    if (!session) {
      return res.status(404).json({ error: 'Active session not found' });
    }

    session.endTime = new Date();
    session.durationSeconds = Math.floor(
      (session.endTime - session.startTime) / 1000
    );

    // Analyze exercise session
    const analysis = ExerciseDetectionService.analyzeExerciseSession(session.stepData);

    session.isValidExercise = analysis.isValid;
    session.validExerciseSeconds = analysis.validSeconds;
    session.invalidReason = analysis.reason;

    if (analysis.isValid && analysis.miningSeconds > 0) {
      session.status = 'completed';
      session.miningDurationSeconds = analysis.miningSeconds;

      // Trigger mining
      logger.info(`Triggering mining for session ${sessionId}: ${analysis.miningSeconds}s`);

      try {
        const miningResult = await CoinDaemonService.startMining(userId, analysis.miningSeconds);

        session.miningTriggered = true;
        session.coinsEarned = miningResult.coinsEarned;

        if (miningResult.coinsEarned > 0) {
          session.status = 'rewarded';

          // Create transaction record
          const transaction = new Transaction({
            userId,
            exerciseSessionId: session._id,
            type: 'mining_reward',
            amount: miningResult.coinsEarned,
            status: 'confirmed',
            miningDurationSeconds: analysis.miningSeconds,
            confirmedAt: new Date(),
            metadata: {
              blocksFound: miningResult.blocksFound,
              validExerciseSeconds: analysis.validSeconds
            }
          });
          await transaction.save();
          session.transactionId = transaction._id;

          // Update user stats
          await User.findByIdAndUpdate(userId, {
            $inc: {
              totalCoinsEarned: miningResult.coinsEarned,
              totalExerciseSeconds: analysis.validSeconds,
              totalSteps: session.totalSteps,
              totalMiningSeconds: analysis.miningSeconds
            },
            lastActiveAt: new Date()
          });
        }
      } catch (miningError) {
        logger.error(`Mining failed for session ${sessionId}:`, miningError);
        session.miningTriggered = false;
      }

    } else {
      session.status = 'invalid';
      // Still update user exercise stats even if no reward
      await User.findByIdAndUpdate(userId, {
        $inc: {
          totalExerciseSeconds: session.durationSeconds,
          totalSteps: session.totalSteps
        },
        lastActiveAt: new Date()
      });
    }

    await session.save();

    logger.info(`Exercise session ended for user ${userId}: ${session.status}`);

    res.json({
      message: 'Exercise session ended',
      session: {
        id: session._id,
        status: session.status,
        durationSeconds: session.durationSeconds,
        totalSteps: session.totalSteps,
        isValidExercise: session.isValidExercise,
        validExerciseSeconds: session.validExerciseSeconds,
        invalidReason: session.invalidReason,
        miningTriggered: session.miningTriggered,
        miningDurationSeconds: session.miningDurationSeconds,
        coinsEarned: session.coinsEarned
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.getSessionHistory = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { limit = 20, offset = 0 } = req.query;

    const sessions = await ExerciseSession.find({ userId })
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .select('-stepData'); // Exclude large stepData array

    const total = await ExerciseSession.countDocuments({ userId });

    res.json({
      sessions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + sessions.length < total
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.getSession = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;

    const session = await ExerciseSession.findOne({
      _id: sessionId,
      userId
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ session });

  } catch (error) {
    next(error);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get session statistics
    const sessionStats = await ExerciseSession.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalDuration: { $sum: '$durationSeconds' },
          totalSteps: { $sum: '$totalSteps' }
        }
      }
    ]);

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySessions = await ExerciseSession.find({
      userId,
      createdAt: { $gte: today }
    });

    const todayStats = {
      sessions: todaySessions.length,
      steps: todaySessions.reduce((sum, s) => sum + s.totalSteps, 0),
      exerciseSeconds: todaySessions.reduce((sum, s) => sum + (s.validExerciseSeconds || 0), 0),
      coinsEarned: todaySessions.reduce((sum, s) => sum + (s.coinsEarned || 0), 0)
    };

    res.json({
      lifetime: {
        totalExerciseSeconds: user.totalExerciseSeconds,
        totalSteps: user.totalSteps,
        totalCoinsEarned: user.totalCoinsEarned,
        totalMiningSeconds: user.totalMiningSeconds
      },
      today: todayStats,
      sessionBreakdown: sessionStats
    });

  } catch (error) {
    next(error);
  }
};
