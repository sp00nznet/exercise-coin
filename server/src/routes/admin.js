const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// All admin routes require admin API key
router.use(adminController.verifyAdmin);

// Dashboard & Overview
router.get('/dashboard', adminController.getDashboard);
router.get('/health', adminController.getSystemHealth);

// User Management
router.get('/users', adminController.getUsers);
router.get('/users/:userId', adminController.getUserDetails);

// Mining Operations
router.get('/miners', adminController.getActiveMiners);
router.get('/mining/metrics', adminController.getMiningMetrics);

// Exercise Monitoring
router.get('/exercise/metrics', adminController.getExerciseMetrics);
router.get('/exercise/sessions', adminController.getRecentSessions);

// System Logs
router.get('/logs', adminController.getLogs);

module.exports = router;
