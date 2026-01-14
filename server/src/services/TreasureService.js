const TreasureDrop = require('../models/TreasureDrop');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

class TreasureService {
  /**
   * Drop coins at a location
   */
  static async dropTreasure(userId, { latitude, longitude, amount, message, locationName }) {
    try {
      // Verify user has enough coins
      const user = await User.findById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      if (user.totalCoinsEarned < amount) {
        return { success: false, error: 'Insufficient coins' };
      }

      // Deduct coins from user
      await User.findByIdAndUpdate(userId, {
        $inc: { totalCoinsEarned: -amount }
      });

      // Create the treasure drop
      const drop = new TreasureDrop({
        droppedBy: userId,
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        locationName: locationName || '',
        amount,
        message: message || '',
        dropType: 'user_drop',
        status: 'active'
      });

      await drop.save();

      // Create transaction record
      await Transaction.create({
        userId,
        type: 'transfer_out',
        amount: -amount,
        status: 'confirmed',
        confirmedAt: new Date(),
        metadata: {
          type: 'treasure_drop',
          treasureDropId: drop._id,
          location: { latitude, longitude }
        }
      });

      logger.info(`User ${userId} dropped ${amount} coins at [${latitude}, ${longitude}]`);

      return {
        success: true,
        drop: {
          id: drop._id,
          amount: drop.amount,
          location: { latitude, longitude },
          locationName: drop.locationName,
          message: drop.message
        }
      };
    } catch (error) {
      logger.error('Error dropping treasure:', error);
      return { success: false, error: 'Failed to drop treasure' };
    }
  }

  /**
   * Find nearby treasure drops
   */
  static async findNearbyTreasure(latitude, longitude, radiusMeters = 5000) {
    try {
      // Find active drops within radius
      const drops = await TreasureDrop.find({
        status: 'active',
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: radiusMeters
          }
        }
      })
      .populate('droppedBy', 'username')
      .limit(50);

      // Calculate distance for each drop
      const dropsWithDistance = drops.map(drop => {
        const distance = this.calculateDistance(
          latitude, longitude,
          drop.location.coordinates[1], drop.location.coordinates[0]
        );

        return {
          id: drop._id,
          amount: drop.amount,
          location: {
            latitude: drop.location.coordinates[1],
            longitude: drop.location.coordinates[0]
          },
          locationName: drop.locationName,
          message: drop.message,
          dropType: drop.dropType,
          droppedBy: drop.droppedBy?.username || 'Exercise Coin',
          distance: Math.round(distance),
          canCollect: distance <= drop.collectRadius,
          createdAt: drop.createdAt
        };
      });

      return { success: true, drops: dropsWithDistance };
    } catch (error) {
      logger.error('Error finding nearby treasure:', error);
      return { success: false, error: 'Failed to find treasure', drops: [] };
    }
  }

  /**
   * Collect treasure at a location
   */
  static async collectTreasure(userId, dropId, { latitude, longitude }) {
    try {
      const drop = await TreasureDrop.findById(dropId);

      if (!drop) {
        return { success: false, error: 'Treasure not found' };
      }

      if (drop.status !== 'active') {
        return { success: false, error: 'Treasure already collected or expired' };
      }

      // Check if user is within collect radius
      const distance = this.calculateDistance(
        latitude, longitude,
        drop.location.coordinates[1], drop.location.coordinates[0]
      );

      if (distance > drop.collectRadius) {
        return {
          success: false,
          error: `Too far from treasure. You need to be within ${drop.collectRadius}m (currently ${Math.round(distance)}m away)`
        };
      }

      // Prevent collecting own drops
      if (drop.droppedBy && drop.droppedBy.toString() === userId) {
        return { success: false, error: 'Cannot collect your own treasure' };
      }

      // Mark as collected
      drop.status = 'collected';
      drop.collectedBy = userId;
      drop.collectedAt = new Date();
      await drop.save();

      // Add coins to collector
      await User.findByIdAndUpdate(userId, {
        $inc: { totalCoinsEarned: drop.amount }
      });

      // Create transaction record
      await Transaction.create({
        userId,
        type: 'transfer_in',
        amount: drop.amount,
        status: 'confirmed',
        confirmedAt: new Date(),
        metadata: {
          type: 'treasure_collect',
          treasureDropId: drop._id,
          droppedBy: drop.droppedBy,
          location: { latitude, longitude }
        }
      });

      logger.info(`User ${userId} collected ${drop.amount} coins from drop ${dropId}`);

      return {
        success: true,
        amount: drop.amount,
        message: drop.message,
        droppedBy: drop.droppedBy
      };
    } catch (error) {
      logger.error('Error collecting treasure:', error);
      return { success: false, error: 'Failed to collect treasure' };
    }
  }

  /**
   * Create a random drop at a location (called by the daemon)
   */
  static async createRandomDrop(latitude, longitude, amount, locationName = '') {
    try {
      const drop = new TreasureDrop({
        droppedBy: null, // System drop
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        locationName,
        amount,
        dropType: 'random_drop',
        message: 'Random treasure drop! Keep exercising!',
        status: 'active',
        // Random drops expire after 7 days
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      await drop.save();

      logger.info(`Random drop created: ${amount} coins at [${latitude}, ${longitude}] - ${locationName}`);

      return { success: true, drop };
    } catch (error) {
      logger.error('Error creating random drop:', error);
      return { success: false, error: 'Failed to create random drop' };
    }
  }

  /**
   * Get user's drop history
   */
  static async getUserDropHistory(userId, limit = 20) {
    try {
      const drops = await TreasureDrop.find({ droppedBy: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('collectedBy', 'username');

      return {
        success: true,
        drops: drops.map(d => ({
          id: d._id,
          amount: d.amount,
          location: {
            latitude: d.location.coordinates[1],
            longitude: d.location.coordinates[0]
          },
          locationName: d.locationName,
          status: d.status,
          collectedBy: d.collectedBy?.username || null,
          collectedAt: d.collectedAt,
          createdAt: d.createdAt
        }))
      };
    } catch (error) {
      logger.error('Error getting drop history:', error);
      return { success: false, drops: [] };
    }
  }

  /**
   * Clean up expired drops
   */
  static async cleanupExpiredDrops() {
    try {
      const result = await TreasureDrop.updateMany(
        {
          status: 'active',
          expiresAt: { $lt: new Date() }
        },
        {
          $set: { status: 'expired' }
        }
      );

      if (result.modifiedCount > 0) {
        logger.info(`Cleaned up ${result.modifiedCount} expired treasure drops`);
      }

      return { success: true, expiredCount: result.modifiedCount };
    } catch (error) {
      logger.error('Error cleaning up expired drops:', error);
      return { success: false };
    }
  }

  /**
   * Calculate distance between two points in meters (Haversine formula)
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static toRad(deg) {
    return deg * (Math.PI / 180);
  }
}

module.exports = TreasureService;
