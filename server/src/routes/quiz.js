const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const validateRequest = require('../middleware/validate');
const { startQuizValidator, submitQuizValidator, createQuestionValidator } = require('../validators/quizValidators');
const quiz = require('../controllers/quizController');

// Start a quiz (randomized questions) - public or auth depending on your policy
router.get('/start', auth, startQuizValidator, validateRequest, quiz.startQuiz);
// Submit answers and record attempt
router.post('/submit', auth, submitQuizValidator, validateRequest, quiz.submitAnswers);
// Get user's attempt history
router.get('/history', auth, quiz.getHistory);
// Get attempt result/details
router.get('/result/:id', auth, quiz.getResult);
// Admin: create question
router.post('/question', auth, requireRole('admin'), createQuestionValidator, validateRequest, quiz.createQuestion);

module.exports = router;
