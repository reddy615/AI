const asyncHandler = require('../utils/asyncHandler');
const { getPersonalizedRecommendations } = require('../services/recommendationService');

exports.getPersonalizedRecommendations = asyncHandler(async (req, res) => {
  const { module, limit, weakAreas } = req.query;
  const parsedWeakAreas = Array.isArray(weakAreas)
    ? weakAreas
    : String(weakAreas || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((topic) => ({ topic }));

  const recommendations = await getPersonalizedRecommendations(req.user.id, {
    module,
    weakAreas: parsedWeakAreas,
    candidateTopics: [],
  });

  const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 10);
  return res.apiSuccess(
    {
      ...recommendations,
      recommendations: (recommendations.recommendations || []).slice(0, safeLimit),
    },
    'Personalized recommendations loaded'
  );
});