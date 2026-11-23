const PedometerService = require('../services/PedometerService');
const logger = require('../utils/logger');

exports.sync = async (req, res, next) => {
  try {
    const result = await PedometerService.sync(req.userId, req.body);
    if (result.status === 200 && result.body.credited.coins > 0) {
      logger.info(`Pedometer sync for user ${req.userId}: ${result.body.credited.steps} steps, ${result.body.credited.coins} EXC`);
    }
    res.status(result.status).json(result.body);
  } catch (error) {
    next(error);
  }
};

exports.status = async (req, res, next) => {
  try {
    res.json(await PedometerService.status(req.userId));
  } catch (error) {
    next(error);
  }
};
