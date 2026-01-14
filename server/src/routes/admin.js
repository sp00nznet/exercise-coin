const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateAdmin, requireSuperAdmin } = require('../middleware/adminAuth');

// Public routes
router.post('/login', adminController.login);

// Protected routes (require admin auth)
router.use(authenticateAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Transactions monitoring
router.get('/transactions', adminController.getTransactions);

// Transfers monitoring
router.get('/transfers', adminController.getTransfers);

// Treasure drops monitoring
router.get('/treasure/drops', adminController.getTreasureDrops);
router.get('/treasure/map', adminController.getTreasureMapData);

// Reports (downloadable)
router.get('/reports/transactions', adminController.generateTransactionReport);
router.get('/reports/transfers', adminController.generateTransferReport);
router.get('/reports/treasure', adminController.generateTreasureReport);

// Drop zones management
router.get('/drop-zones', adminController.getDropZones);
router.post('/drop-zones', adminController.createDropZone);
router.put('/drop-zones/:zoneId', adminController.updateDropZone);
router.delete('/drop-zones/:zoneId', adminController.deleteDropZone);

// Friendly transfers monitoring
router.get('/friendly-transfers', adminController.getFriendlyTransfers);

// User management
router.get('/users', adminController.getUsers);
router.get('/users/:userId', adminController.getUserDetails);

// Superadmin only routes
router.post('/admins', requireSuperAdmin, adminController.createAdmin);

module.exports = router;
