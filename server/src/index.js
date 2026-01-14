require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const exerciseRoutes = require('./routes/exercise');
const walletRoutes = require('./routes/wallet');
const userRoutes = require('./routes/user');
const achievementRoutes = require('./routes/achievements');
const treasureRoutes = require('./routes/treasure');
const transferRoutes = require('./routes/transfer');
const adminRoutes = require('./routes/admin');
const restStopRoutes = require('./routes/restStop');
const exchangeRoutes = require('./routes/exchange');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { AchievementService, RandomDropDaemon, FriendlinessDaemon, TreasureService, TransferService } = require('./services');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/exercise', exerciseRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/user', userRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/treasure', treasureRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/rest-stop', restStopRoutes);
app.use('/api/exchange', exchangeRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Database connection and server start
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/exercise-coin';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    logger.info('Connected to MongoDB');

    // Initialize achievements in database
    await AchievementService.initializeAchievements();

    // Initialize random drop daemon (runs weekly on Sundays)
    RandomDropDaemon.initialize();

    // Initialize friendliness daemon (runs weekly on Saturdays)
    FriendlinessDaemon.initialize();

    // Run cleanup tasks periodically (every hour)
    setInterval(async () => {
      await TreasureService.cleanupExpiredDrops();
      await TransferService.cleanupExpiredTransfers();
    }, 60 * 60 * 1000);

    app.listen(PORT, () => {
      logger.info(`Exercise Coin server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
