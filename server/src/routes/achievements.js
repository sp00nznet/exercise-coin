const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get all achievements with user progress
router.get('/', achievementController.getAchievements);

// Check for new achievements
router.post('/check', achievementController.checkAchievements);

// Get newly unlocked achievements (for notifications)
router.get('/new', achievementController.getNewAchievements);

module.exports = router;
