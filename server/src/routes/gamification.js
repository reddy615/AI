const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const gamificationController = require('../controllers/gamificationController');

router.get('/me', auth, gamificationController.getMyGamification);
router.get('/leaderboard', auth, gamificationController.getGamificationLeaderboard);

module.exports = router;