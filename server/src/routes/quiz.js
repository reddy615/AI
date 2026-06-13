const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const validateRequest = require('../middleware/validate');
const { startQuizValidator, submitQuizValidator, createQuestionValidator } = require('../validators/quizValidators');
const quiz = require('../controllers/quizController');
const {
  requireAssessmentAccess,
  resolveQuizAssessment,
} = require('../middleware/assessmentAccess');

// Start a quiz (randomized questions) - public or auth depending on your policy
router.get('/start', auth, requireAssessmentAccess(resolveQuizAssessment), startQuizValidator, validateRequest, quiz.startQuiz);
// Submit answers and record attempt
router.post('/submit', auth, requireAssessmentAccess(resolveQuizAssessment), submitQuizValidator, validateRequest, quiz.submitAnswers);
// Get user's attempt history
router.get('/history', auth, quiz.getHistory);
// Get attempt result/details
router.get('/result/:id', auth, quiz.getResult);
// Admin: create question
router.post('/question', auth, requireRole('admin'), createQuestionValidator, validateRequest, quiz.createQuestion);

module.exports = router;
