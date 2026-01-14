const express = require('express');
const router = express.Router();
const RestStopService = require('../services/RestStopService');
const { authenticateToken } = require('../middleware/auth');

/**
 * 🍔 Rest Stop Bonus Routes
 *
 * Endpoints for claiming rest stop bonuses when hiking friends
 * stop at restaurants/cafes together.
 */

// All routes require authentication
router.use(authenticateToken);

/**
 * Check if user is eligible for a rest stop bonus
 * GET /api/rest-stop/check
 */
router.get('/check', async (req, res) => {
  try {
    const { latitude, longitude, venueType, venueName } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location required' });
    }

    const result = await RestStopService.checkEligibility(
      req.user.id,
      { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
      { type: venueType, name: venueName }
    );

    res.json(result);
  } catch (error) {
    console.error('Error checking rest stop eligibility:', error);
    res.status(500).json({ error: 'Failed to check eligibility' });
  }
});

/**
 * Claim a rest stop bonus with a friend
 * POST /api/rest-stop/claim
 */
router.post('/claim', async (req, res) => {
  try {
    const { friendId, latitude, longitude, venue } = req.body;

    if (!friendId) {
      return res.status(400).json({ error: 'Friend ID required' });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location required' });
    }

    const result = await RestStopService.claimRestStopBonus(
      req.user.id,
      friendId,
      { latitude, longitude },
      venue || {}
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error claiming rest stop bonus:', error);
    res.status(500).json({ error: 'Failed to claim bonus' });
  }
});

/**
 * Find nearby friends who are also resting
 * GET /api/rest-stop/nearby-friends
 */
router.get('/nearby-friends', async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location required' });
    }

    const result = await RestStopService.findNearbyRestingFriends(
      req.user.id,
      { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
      parseInt(radius) || 100
    );

    res.json(result);
  } catch (error) {
    console.error('Error finding nearby friends:', error);
    res.status(500).json({ error: 'Failed to find nearby friends' });
  }
});

/**
 * Get rest stop bonus history
 * GET /api/rest-stop/history
 */
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = await RestStopService.getBonusHistory(req.user.id, limit);
    res.json(result);
  } catch (error) {
    console.error('Error getting rest stop history:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

module.exports = router;
