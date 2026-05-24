const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const recommendationController = require('../controllers/recommendationController');

router.get('/personalized', auth, recommendationController.getPersonalizedRecommendations);

module.exports = router;