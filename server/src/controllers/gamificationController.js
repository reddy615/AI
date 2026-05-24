const asyncHandler = require('../utils/asyncHandler');
const { getLeaderboard, getProgress } = require('../services/gamificationService');

exports.getMyGamification = asyncHandler(async (req, res) => {
  const data = await getProgress(req.user.id);
  return res.apiSuccess(data, 'Gamification profile loaded');
});

exports.getGamificationLeaderboard = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const leaderboard = await getLeaderboard(limit);
  return res.apiSuccess({ leaderboard }, 'Gamification leaderboard loaded');
});