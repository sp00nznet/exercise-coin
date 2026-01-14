const TreasureDrop = require('../models/TreasureDrop');
const DropZone = require('../models/DropZone');
const logger = require('../utils/logger');
const { TOKENOMICS, getRandomTier, getRandomAmountForTier } = require('../config/tokenomics');

// 🌍 Exercise-friendly locations for random drops
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

  // Major hiking destinations
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
  { lat: 52.5200, lon: 13.4050, name: 'Berlin, Tiergarten' },
  { lat: 55.7558, lon: 37.6173, name: 'Moscow, Gorky Park' },
  { lat: 19.4326, lon: -99.1332, name: 'Mexico City, Chapultepec' },
  { lat: -22.9068, lon: -43.1729, name: 'Rio, Tijuca Forest' },
  { lat: 1.3521, lon: 103.8198, name: 'Singapore, MacRitchie Trail' },
];

class RandomDropDaemon {
  static isRunning = false;
  static lastRunTime = null;
  static intervalId = null;

  /**
   * Initialize the daemon scheduler
   * Runs every Sunday at midnight UTC
   */
  static initialize() {
    this.intervalId = setInterval(() => {
      this.checkAndRun();
    }, 60 * 60 * 1000); // Check every hour

    this.checkAndRun();
    logger.info('🎲 RandomDropDaemon initialized - weekly treasure drops enabled');
  }

  /**
   * Check if it's time to run and execute if so
   */
  static async checkAndRun() {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday
    const hour = now.getUTCHours();

    if (dayOfWeek === 0 && hour === 0) {
      if (this.lastRunTime) {
        const hoursSinceLastRun = (now - this.lastRunTime) / (1000 * 60 * 60);
        if (hoursSinceLastRun < 24) return;
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

    logger.info('🎰 RandomDropDaemon starting weekly treasure drop mining...');

    try {
      // Mine for coins
      const miningResult = await this.mineForDrops();

      if (!miningResult.success) {
        this.isRunning = false;
        return { success: false, error: 'Mining failed' };
      }

      const totalCoins = miningResult.coinsEarned;
      logger.info(`⛏️ Mined ${totalCoins} EXC for treasure drops`);

      if (totalCoins <= 0) {
        this.isRunning = false;
        return { success: true, drops: 0, totalCoins: 0 };
      }

      // Create tiered drops
      const drops = await this.createTieredDrops(totalCoins);

      // Log summary
      const tierCounts = this.summarizeDrops(drops);
      logger.info(`🎁 RandomDropDaemon completed:`, tierCounts);

      this.isRunning = false;
      return { success: true, drops: drops.length, totalCoins, tierCounts };
    } catch (error) {
      logger.error('RandomDropDaemon error:', error);
      this.isRunning = false;
      return { success: false, error: error.message };
    }
  }

  /**
   * Mine coins for random drops using F7Coin tokenomics
   */
  static async mineForDrops() {
    try {
      const miningMinutes = TOKENOMICS.RANDOM_DROPS.MINING_MINUTES;
      const coinsPerMinute = TOKENOMICS.EXERCISE_MINING.COINS_PER_MINING_MINUTE;
      const coinsEarned = miningMinutes * coinsPerMinute;

      logger.info(`⛏️ Mining for ${miningMinutes} minutes at ${coinsPerMinute} EXC/min`);

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
   * Create tiered treasure drops with legendary/epic/rare/common distribution
   */
  static async createTieredDrops(totalCoins) {
    const drops = [];
    const numDrops = TOKENOMICS.RANDOM_DROPS.DROPS_PER_WEEK;
    const locations = await this.getDropLocations(numDrops);

    let coinsRemaining = totalCoins;

    for (let i = 0; i < numDrops && coinsRemaining > 0; i++) {
      // Get random tier
      const tier = getRandomTier();

      // Calculate drop amount (ensure we don't exceed remaining coins)
      let dropAmount = getRandomAmountForTier(tier);
      dropAmount = Math.min(dropAmount, coinsRemaining);

      if (dropAmount < 1) continue; // Skip tiny drops

      const location = locations[i];

      // Add slight random offset to coordinates (within ~500m)
      const latOffset = (Math.random() - 0.5) * 0.01;
      const lonOffset = (Math.random() - 0.5) * 0.01;

      try {
        const drop = await TreasureDrop.create({
          amount: dropAmount,
          location: {
            type: 'Point',
            coordinates: [location.lon + lonOffset, location.lat + latOffset]
          },
          dropType: 'random',
          status: 'active',
          message: tier.message,
          expiresAt: new Date(Date.now() + TOKENOMICS.RANDOM_DROPS.EXPIRY_DAYS * 24 * 60 * 60 * 1000),
          metadata: {
            tier: tier.name,
            tierLabel: tier.label,
            locationName: location.name
          }
        });

        drops.push({
          id: drop._id,
          amount: dropAmount,
          tier: tier.name,
          tierLabel: tier.label,
          location: location.name
        });

        coinsRemaining -= dropAmount;

        logger.info(`${tier.label} drop created: ${dropAmount} EXC at ${location.name}`);
      } catch (error) {
        logger.error(`Failed to create drop at ${location.name}:`, error);
      }
    }

    return drops;
  }

  /**
   * Get drop locations - prioritize admin-configured zones
   */
  static async getDropLocations(count) {
    const locations = [];

    // First, check for admin-configured drop zones
    try {
      const activeZones = await DropZone.find({ isActive: true })
        .sort({ priority: -1 })
        .limit(Math.floor(count / 2)); // Use up to half from configured zones

      for (const zone of activeZones) {
        const location = this.getLocationFromZone(zone);
        if (location) {
          locations.push(location);
        }
      }
    } catch (error) {
      logger.error('Error fetching drop zones:', error);
    }

    // Fill remaining with default exercise locations
    const remaining = count - locations.length;
    const shuffled = [...EXERCISE_LOCATIONS].sort(() => Math.random() - 0.5);
    locations.push(...shuffled.slice(0, remaining));

    return locations;
  }

  /**
   * Get a random location within a drop zone
   */
  static getLocationFromZone(zone) {
    if (zone.zoneType === 'point' && zone.center) {
      return {
        lat: zone.center.latitude,
        lon: zone.center.longitude,
        name: zone.name
      };
    }

    if (zone.zoneType === 'area' && zone.polygon && zone.polygon.length >= 3) {
      // Get centroid of polygon
      const centroid = this.getPolygonCentroid(zone.polygon);
      return {
        lat: centroid.lat,
        lon: centroid.lon,
        name: zone.name
      };
    }

    // For zipcode zones, we'd need a geocoding service
    // For now, return null and use default locations
    return null;
  }

  /**
   * Calculate centroid of a polygon
   */
  static getPolygonCentroid(polygon) {
    let latSum = 0, lonSum = 0;
    for (const point of polygon) {
      lonSum += point[0];
      latSum += point[1];
    }
    return {
      lat: latSum / polygon.length,
      lon: lonSum / polygon.length
    };
  }

  /**
   * Summarize drops by tier
   */
  static summarizeDrops(drops) {
    const summary = {
      total: drops.length,
      totalCoins: drops.reduce((sum, d) => sum + d.amount, 0),
      COMMON: 0,
      RARE: 0,
      EPIC: 0,
      LEGENDARY: 0
    };

    for (const drop of drops) {
      summary[drop.tier] = (summary[drop.tier] || 0) + 1;
    }

    return summary;
  }

  /**
   * Get daemon status
   */
  static getStatus() {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      config: TOKENOMICS.RANDOM_DROPS,
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
    nextSunday.setUTCDate(now.getUTCDate() + (daysUntilSunday || 7));
    nextSunday.setUTCHours(0, 0, 0, 0);
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
