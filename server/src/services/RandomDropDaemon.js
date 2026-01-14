const TreasureService = require('./TreasureService');
const TransferService = require('./TransferService');
const CoinDaemonService = require('./CoinDaemonService');
const logger = require('../utils/logger');

// Exercise-friendly locations for random drops
// These are popular hiking/exercise areas - in production, this could be
// fetched from a hiking/fitness API or user-contributed locations
const EXERCISE_LOCATIONS = [
  // US National Parks / Popular Hiking Spots
  { lat: 37.7749, lon: -122.4194, name: 'San Francisco, Golden Gate Park' },
  { lat: 40.7128, lon: -74.0060, name: 'New York, Central Park' },
  { lat: 34.0522, lon: -118.2437, name: 'Los Angeles, Griffith Park' },
  { lat: 41.8781, lon: -87.6298, name: 'Chicago, Lakefront Trail' },
  { lat: 47.6062, lon: -122.3321, name: 'Seattle, Discovery Park' },
  { lat: 39.7392, lon: -104.9903, name: 'Denver, Red Rocks' },
  { lat: 33.4484, lon: -112.0740, name: 'Phoenix, Camelback Mountain' },
  { lat: 29.7604, lon: -95.3698, name: 'Houston, Memorial Park' },
  { lat: 25.7617, lon: -80.1918, name: 'Miami, South Beach Boardwalk' },
  { lat: 42.3601, lon: -71.0589, name: 'Boston, Charles River Esplanade' },

  // More hiking destinations
  { lat: 36.1070, lon: -112.1130, name: 'Grand Canyon, South Rim Trail' },
  { lat: 37.8651, lon: -119.5383, name: 'Yosemite, Valley Floor' },
  { lat: 36.5054, lon: -118.5755, name: 'Sequoia, Giant Forest' },
  { lat: 44.4280, lon: -110.5885, name: 'Yellowstone, Old Faithful Area' },
  { lat: 43.7904, lon: -110.6818, name: 'Grand Teton, Jenny Lake' },
  { lat: 38.5733, lon: -109.5498, name: 'Arches, Devils Garden' },
  { lat: 37.2982, lon: -113.0263, name: 'Zion, Angels Landing Trail' },
  { lat: 36.4904, lon: -117.0678, name: 'Death Valley, Badwater' },
  { lat: 48.7596, lon: -113.7870, name: 'Glacier, Going-to-the-Sun Road' },
  { lat: 35.6117, lon: -83.4895, name: 'Great Smoky Mountains' },

  // International locations
  { lat: 51.5074, lon: -0.1278, name: 'London, Hyde Park' },
  { lat: 48.8566, lon: 2.3522, name: 'Paris, Bois de Boulogne' },
  { lat: 35.6762, lon: 139.6503, name: 'Tokyo, Yoyogi Park' },
  { lat: -33.8688, lon: 151.2093, name: 'Sydney, Bondi to Coogee Walk' },
  { lat: 49.2827, lon: -123.1207, name: 'Vancouver, Stanley Park' },
];

class RandomDropDaemon {
  static isRunning = false;
  static lastRunTime = null;
  static miningDurationSeconds = 20 * 60; // 20 minutes
  static intervalId = null;

  /**
   * Initialize the daemon scheduler
   * Runs every Sunday at midnight UTC
   */
  static initialize() {
    // Check every hour if it's time to run
    this.intervalId = setInterval(() => {
      this.checkAndRun();
    }, 60 * 60 * 1000); // Check every hour

    // Also check on startup
    this.checkAndRun();

    logger.info('RandomDropDaemon initialized - will run weekly');
  }

  /**
   * Check if it's time to run and execute if so
   */
  static async checkAndRun() {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday
    const hour = now.getUTCHours();

    // Run on Sunday at midnight UTC
    if (dayOfWeek === 0 && hour === 0) {
      // Check if we already ran this week
      if (this.lastRunTime) {
        const hoursSinceLastRun = (now - this.lastRunTime) / (1000 * 60 * 60);
        if (hoursSinceLastRun < 24) {
          return; // Already ran recently
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
      logger.warn('RandomDropDaemon is already running');
      return { success: false, error: 'Already running' };
    }

    this.isRunning = true;
    this.lastRunTime = new Date();

    logger.info('RandomDropDaemon starting weekly treasure drop mining...');

    try {
      // Mine for coins using the system daemon
      const miningResult = await this.mineForDrops();

      if (!miningResult.success) {
        this.isRunning = false;
        return { success: false, error: 'Mining failed' };
      }

      const totalCoins = miningResult.coinsEarned;

      if (totalCoins <= 0) {
        logger.info('RandomDropDaemon: No coins mined this week');
        this.isRunning = false;
        return { success: true, drops: 0, totalCoins: 0 };
      }

      // Distribute coins across random locations
      const drops = await this.distributeDrops(totalCoins);

      logger.info(`RandomDropDaemon completed: ${drops.length} drops totaling ${totalCoins} coins`);

      this.isRunning = false;
      return { success: true, drops: drops.length, totalCoins };
    } catch (error) {
      logger.error('RandomDropDaemon error:', error);
      this.isRunning = false;
      return { success: false, error: error.message };
    }
  }

  /**
   * Mine coins for random drops
   */
  static async mineForDrops() {
    try {
      // Use a special system user ID for the random drop miner
      const systemUserId = 'random_drop_daemon';

      // Simulate mining - in production this would actually trigger
      // the coin daemon to mine for the specified duration
      // For now, we'll estimate based on typical mining rates
      const estimatedCoinsPerMinute = 0.1; // Adjust based on actual mining rates
      const miningMinutes = this.miningDurationSeconds / 60;
      const coinsEarned = miningMinutes * estimatedCoinsPerMinute;

      logger.info(`RandomDropDaemon mined for ${miningMinutes} minutes, earned ~${coinsEarned} coins`);

      return {
        success: true,
        coinsEarned: Math.round(coinsEarned * 100) / 100
      };
    } catch (error) {
      logger.error('Mining for drops failed:', error);
      return { success: false, coinsEarned: 0 };
    }
  }

  /**
   * Distribute mined coins as random drops
   */
  static async distributeDrops(totalCoins) {
    const drops = [];

    // Determine number of drops (between 5-15)
    const numDrops = Math.min(15, Math.max(5, Math.floor(totalCoins / 0.5)));
    const coinsPerDrop = totalCoins / numDrops;

    // Randomly select locations
    const selectedLocations = this.getRandomLocations(numDrops);

    for (const location of selectedLocations) {
      // Add some randomness to exact drop amount
      const dropAmount = Math.round((coinsPerDrop * (0.8 + Math.random() * 0.4)) * 100) / 100;

      // Add slight random offset to coordinates (within ~500m)
      const latOffset = (Math.random() - 0.5) * 0.01;
      const lonOffset = (Math.random() - 0.5) * 0.01;

      const result = await TreasureService.createRandomDrop(
        location.lat + latOffset,
        location.lon + lonOffset,
        dropAmount,
        location.name
      );

      if (result.success) {
        drops.push(result.drop);
      }
    }

    return drops;
  }

  /**
   * Get random unique locations from the pool
   */
  static getRandomLocations(count) {
    const shuffled = [...EXERCISE_LOCATIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Get daemon status
   */
  static getStatus() {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      miningDurationSeconds: this.miningDurationSeconds,
      nextScheduledRun: this.getNextScheduledRun(),
      locationsCount: EXERCISE_LOCATIONS.length
    };
  }

  /**
   * Calculate next scheduled run time
   */
  static getNextScheduledRun() {
    const now = new Date();
    const daysUntilSunday = (7 - now.getUTCDay()) % 7;
    const nextSunday = new Date(now);
    nextSunday.setUTCDate(now.getUTCDate() + daysUntilSunday);
    nextSunday.setUTCHours(0, 0, 0, 0);

    if (nextSunday <= now) {
      nextSunday.setUTCDate(nextSunday.getUTCDate() + 7);
    }

    return nextSunday;
  }

  /**
   * Stop the daemon
   */
  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    logger.info('RandomDropDaemon stopped');
  }
}

module.exports = RandomDropDaemon;
