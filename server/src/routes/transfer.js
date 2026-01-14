const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Send coins directly to a user
router.post('/send', transferController.sendToUser);

// Create QR code transfer
router.post('/qr/create', transferController.createQRTransfer);

// Claim QR code transfer
router.post('/qr/claim', transferController.claimQRTransfer);

// Cancel pending QR transfer
router.delete('/qr/:transferId', transferController.cancelQRTransfer);

// Get pending QR transfers
router.get('/pending', transferController.getPendingTransfers);

// Get transfer history
router.get('/history', transferController.getTransferHistory);

module.exports = router;
