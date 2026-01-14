const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// Profile management
router.put('/profile', validate(schemas.updateProfile), userController.updateProfile);
router.put('/password', validate(schemas.changePassword), userController.changePassword);

// Dashboard
router.get('/dashboard', userController.getDashboard);

// Leaderboard (public data but requires auth to access)
router.get('/leaderboard', userController.getLeaderboard);

// Account deletion
router.delete('/account', validate(schemas.deleteAccount), userController.deleteAccount);

module.exports = router;
