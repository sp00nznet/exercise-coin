const express = require('express');
const router = express.Router();
const pedometerController = require('../controllers/pedometerController');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

router.use(authenticate);

router.post('/sync', validate(schemas.pedometerSync, { assign: true }), pedometerController.sync);
router.get('/status', pedometerController.status);

module.exports = router;
