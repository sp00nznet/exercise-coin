const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Wallet information
router.get('/balance', walletController.getBalance);
router.get('/address', walletController.getWalletAddress);

// Transactions
router.get('/transactions', walletController.getTransactions);
router.get('/transaction/:transactionId', walletController.getTransaction);

// Daemon management
router.get('/daemon/status', walletController.getDaemonStatus);
router.post('/daemon/start', walletController.startDaemon);
router.post('/daemon/stop', walletController.stopDaemon);

// Earnings
router.get('/earnings', walletController.getEarningsHistory);

module.exports = router;
