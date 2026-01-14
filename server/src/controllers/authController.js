const jwt = require('jsonwebtoken');
const User = require('../models/User');
const CoinDaemonService = require('../services/CoinDaemonService');
const logger = require('../utils/logger');

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

exports.register = async (req, res, next) => {
  try {
    const { email, password, username } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        error: existingUser.email === email
          ? 'Email already registered'
          : 'Username already taken'
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      username
    });

    await user.save();

    // Initialize user's coin daemon
    try {
      await CoinDaemonService.initializeUserDaemon(user._id);
    } catch (daemonError) {
      logger.warn(`Failed to initialize daemon during registration: ${daemonError.message}`);
      // Don't fail registration if daemon init fails
    }

    const token = generateToken(user._id);

    logger.info(`New user registered: ${username}`);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        walletAddress: user.walletAddress
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last active
    user.lastActiveAt = new Date();
    await user.save();

    // Ensure daemon is running
    try {
      await CoinDaemonService.initializeUserDaemon(user._id);
    } catch (daemonError) {
      logger.warn(`Failed to initialize daemon during login: ${daemonError.message}`);
    }

    const token = generateToken(user._id);

    logger.info(`User logged in: ${user.username}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        walletAddress: user.walletAddress,
        totalCoinsEarned: user.totalCoinsEarned,
        totalExerciseSeconds: user.totalExerciseSeconds,
        totalSteps: user.totalSteps
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const daemonStatus = CoinDaemonService.getDaemonStatus(user._id);

    res.json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        walletAddress: user.walletAddress,
        totalCoinsEarned: user.totalCoinsEarned,
        totalExerciseSeconds: user.totalExerciseSeconds,
        totalSteps: user.totalSteps,
        totalMiningSeconds: user.totalMiningSeconds,
        daemonStatus: daemonStatus.status,
        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    // Optionally stop user's daemon on logout
    // await CoinDaemonService.stopUserDaemon(req.userId);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};
