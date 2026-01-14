const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// Session management
router.post('/session/start', exerciseController.startSession);
router.post('/session/steps', validate(schemas.recordSteps), exerciseController.recordSteps);
router.post('/session/end', validate(schemas.endSession), exerciseController.endSession);

// Session history
router.get('/sessions', exerciseController.getSessionHistory);
router.get('/session/:sessionId', exerciseController.getSession);

// Statistics
router.get('/stats', exerciseController.getStats);

module.exports = router;
