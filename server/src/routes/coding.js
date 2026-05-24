const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const validateRequest = require('../middleware/validate');
const { listChallengesValidator, runSubmissionValidator, getChallengeValidator, createChallengeValidator } = require('../validators/codingValidators');
const codingController = require('../controllers/codingController');

router.get('/challenges', auth, listChallengesValidator, validateRequest, codingController.listChallenges);
router.get('/challenges/:id', auth, getChallengeValidator, validateRequest, codingController.getChallenge);
router.post('/run', auth, runSubmissionValidator, validateRequest, codingController.runSubmission);
router.get('/leaderboard', auth, codingController.getLeaderboard);
router.post('/challenges', auth, requireRole('admin'), createChallengeValidator, validateRequest, codingController.createChallenge);

module.exports = router;
