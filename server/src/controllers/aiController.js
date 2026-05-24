const asyncHandler = require('../utils/asyncHandler');
const { sendError } = require('../utils/apiResponse');
const AIQuestion = require('../models/AIQuestion');
const { generateQuestions } = require('../services/aiService');
const { getPersonalizedRecommendations } = require('../services/recommendationService');

exports.generateQuestions = asyncHandler(async (req, res) => {
  const { module = 'technical', difficulty = 'medium', count = 5, candidateProfile = {} } = req.body;
  const safeCount = Math.min(Number(count) || 5, 20);

  const questions = await generateQuestions({
    userId: req.user.id,
    module,
    difficulty,
    count: safeCount,
    candidateProfile,
  });

  return res.apiSuccess({ questions }, 'AI questions generated', 201);
});

exports.listGeneratedQuestions = asyncHandler(async (req, res) => {
  const { module, difficulty, limit = 20 } = req.query;
  const query = { user: req.user.id };
  if (module) query.module = module;
  if (difficulty) query.difficulty = difficulty;

  const questions = await AIQuestion.find(query).sort({ createdAt: -1 }).limit(Math.min(Number(limit) || 20, 100)).lean();
  return res.apiSuccess({ questions }, 'Generated questions loaded');
});

exports.getAIRecommendations = asyncHandler(async (req, res) => {
  const weakAreas = Array.isArray(req.body?.weakAreas) ? req.body.weakAreas.map((area) => ({ topic: area })) : [];
  const recommendations = await getPersonalizedRecommendations(req.user.id, {
    weakAreas,
  });

  return res.apiSuccess(recommendations, 'Recommendations generated');
});
