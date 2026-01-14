const express = require('express');
const router = express.Router();
const treasureController = require('../controllers/treasureController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Drop treasure at a location
router.post('/drop', treasureController.dropTreasure);

// Find nearby treasure
router.get('/nearby', treasureController.findNearby);

// Collect treasure
router.post('/collect', treasureController.collectTreasure);

// Get user's drop history
router.get('/history', treasureController.getDropHistory);

module.exports = router;
