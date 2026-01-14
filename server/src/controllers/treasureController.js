const TreasureService = require('../services/TreasureService');
const logger = require('../utils/logger');

exports.dropTreasure = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { latitude, longitude, amount, message, locationName } = req.body;

    if (!latitude || !longitude || !amount) {
      return res.status(400).json({ error: 'latitude, longitude, and amount are required' });
    }

    if (amount < 0.01) {
      return res.status(400).json({ error: 'Minimum drop amount is 0.01 EXC' });
    }

    const result = await TreasureService.dropTreasure(userId, {
      latitude,
      longitude,
      amount,
      message,
      locationName
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

exports.findNearby = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'latitude and longitude are required' });
    }

    const result = await TreasureService.findNearbyTreasure(
      parseFloat(latitude),
      parseFloat(longitude),
      parseInt(radius)
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.collectTreasure = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { dropId, latitude, longitude } = req.body;

    if (!dropId || !latitude || !longitude) {
      return res.status(400).json({ error: 'dropId, latitude, and longitude are required' });
    }

    const result = await TreasureService.collectTreasure(userId, dropId, {
      latitude,
      longitude
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getDropHistory = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { limit = 20 } = req.query;

    const result = await TreasureService.getUserDropHistory(userId, parseInt(limit));

    res.json(result);
  } catch (error) {
    next(error);
  }
};
