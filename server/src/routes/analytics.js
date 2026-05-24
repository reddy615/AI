const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

router.get('/overview', auth, analyticsController.getOverview);
router.get('/trends', auth, analyticsController.getTrends);
router.get('/recommendations', auth, analyticsController.getRecommendations);

module.exports = router;
