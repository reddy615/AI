const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const validateRequest = require('../middleware/validate');
const { generateQuestionsValidator, listAIQuestionsValidator } = require('../validators/aiValidators');
const aiController = require('../controllers/aiController');

router.post('/generate', auth, generateQuestionsValidator, validateRequest, aiController.generateQuestions);
router.get('/questions', auth, listAIQuestionsValidator, validateRequest, aiController.listGeneratedQuestions);
router.post('/recommendations', auth, aiController.getAIRecommendations);

module.exports = router;
