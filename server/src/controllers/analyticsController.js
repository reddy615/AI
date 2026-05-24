const asyncHandler = require('../utils/asyncHandler');
const { getUserAnalytics } = require('../services/analyticsService');
const { getPersonalizedRecommendations } = require('../services/recommendationService');

exports.getOverview = asyncHandler(async (req, res) => {
  const analytics = await getUserAnalytics(req.user.id);
  return res.apiSuccess({ analytics }, 'Analytics overview loaded');
});

exports.getRecommendations = asyncHandler(async (req, res) => {
  const bundle = await getPersonalizedRecommendations(req.user.id);
  return res.apiSuccess(bundle, 'Recommendations loaded');
});

exports.getTrends = asyncHandler(async (req, res) => {
  const analytics = await getUserAnalytics(req.user.id);
  const trends = analytics.quizScores.map((item, index) => ({
    index: index + 1,
    date: item.date,
    score: item.score,
    accuracy: item.correct + item.wrong + item.skipped > 0
      ? Math.round((item.correct / Math.max(item.correct + item.wrong + item.skipped, 1)) * 100)
      : 0,
    module: item.module,
  }));

  return res.apiSuccess({ trends }, 'Trends loaded');
});
