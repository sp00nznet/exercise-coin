const TransferService = require('../services/TransferService');
const logger = require('../utils/logger');

exports.sendToUser = async (req, res, next) => {
  try {
    const fromUserId = req.userId;
    const { username, amount, message } = req.body;

    if (!username || !amount) {
      return res.status(400).json({ error: 'username and amount are required' });
    }

    if (amount < 0.01) {
      return res.status(400).json({ error: 'Minimum transfer amount is 0.01 EXC' });
    }

    const result = await TransferService.sendToUser(fromUserId, username, amount, message);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.createQRTransfer = async (req, res, next) => {
  try {
    const fromUserId = req.userId;
    const { amount, message, expiresInHours = 24 } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'amount is required' });
    }

    if (amount < 0.01) {
      return res.status(400).json({ error: 'Minimum transfer amount is 0.01 EXC' });
    }

    const result = await TransferService.createQRTransfer(
      fromUserId,
      amount,
      message,
      expiresInHours
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

exports.claimQRTransfer = async (req, res, next) => {
  try {
    const claimUserId = req.userId;
    const { claimCode } = req.body;

    if (!claimCode) {
      return res.status(400).json({ error: 'claimCode is required' });
    }

    const result = await TransferService.claimQRTransfer(claimUserId, claimCode);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.cancelQRTransfer = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { transferId } = req.params;

    const result = await TransferService.cancelQRTransfer(userId, transferId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getPendingTransfers = async (req, res, next) => {
  try {
    const userId = req.userId;

    const result = await TransferService.getPendingTransfers(userId);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getTransferHistory = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { limit = 20 } = req.query;

    const result = await TransferService.getTransferHistory(userId, parseInt(limit));

    res.json(result);
  } catch (error) {
    next(error);
  }
};
