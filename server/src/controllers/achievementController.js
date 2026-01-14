const AchievementService = require('../services/AchievementService');
const logger = require('../utils/logger');

exports.getAchievements = async (req, res, next) => {
  try {
    const userId = req.userId;
    const result = await AchievementService.getUserAchievements(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.checkAchievements = async (req, res, next) => {
  try {
    const userId = req.userId;
    const result = await AchievementService.checkAchievements(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getNewAchievements = async (req, res, next) => {
  try {
    const userId = req.userId;
    const result = await AchievementService.getUnnotifiedAchievements(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
