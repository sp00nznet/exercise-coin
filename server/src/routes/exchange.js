const express = require('express');
const router = express.Router();
const exchangeController = require('../controllers/exchangeController');
const { authenticate } = require('../middleware/auth');
const { authenticateAdmin } = require('../middleware/adminAuth');

/**
 * 💱 Exchange Routes
 *
 * User-facing cryptocurrency exchange endpoints
 */

// ============ PUBLIC ROUTES ============

// Get available currencies
router.get('/currencies', exchangeController.getCurrencies);

// Get exchange rate for specific currency
router.get('/rate/:currency', exchangeController.getRate);

// ============ USER ROUTES (require auth) ============

router.use('/user', authenticate);

// Get user's order history
router.get('/user/orders', exchangeController.getOrders);

// Create sell order (sell EXC for other currency)
router.post('/user/sell', exchangeController.createSellOrder);

// Create buy order (buy EXC with other currency)
router.post('/user/buy', exchangeController.createBuyOrder);

// Cancel pending order
router.delete('/user/orders/:orderId', exchangeController.cancelOrder);

// ============ ADMIN ROUTES ============

router.use('/admin', authenticateAdmin);

// Get all wallets
router.get('/admin/wallets', exchangeController.adminGetWallets);

// Create/update wallet
router.post('/admin/wallets', exchangeController.adminUpsertWallet);

// Update exchange rate
router.put('/admin/rate/:currency', exchangeController.adminUpdateRate);

// Delete wallet
router.delete('/admin/wallets/:currency', exchangeController.adminDeleteWallet);

// Get all orders (with filters)
router.get('/admin/orders', exchangeController.adminGetOrders);

// Process order (complete/fail/process)
router.post('/admin/orders/:orderId/process', exchangeController.adminProcessOrder);

module.exports = router;
