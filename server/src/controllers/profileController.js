const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendError } = require('../utils/apiResponse');

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password').lean();
  if (!user) return sendError(res, 'User not found', 404);
  return res.apiSuccess({ user }, 'Profile loaded');
});

exports.updatePreferences = asyncHandler(async (req, res) => {
  const { preferredLanguage } = req.body;
  const allowedLanguages = new Set(['en', 'es', 'fr', 'hi']);

  if (preferredLanguage && !allowedLanguages.has(preferredLanguage)) {
    return sendError(res, 'Unsupported language', 400);
  }

  const user = await User.findById(req.user.id);
  if (!user) return sendError(res, 'User not found', 404);

  if (preferredLanguage) {
    user.preferredLanguage = preferredLanguage;
    await user.save();
  }

  return res.apiSuccess({ preferredLanguage: user.preferredLanguage || 'en' }, 'Preferences updated');
});

exports.uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) return sendError(res, 'No file uploaded', 400);
  const user = await User.findById(req.user.id);
  if (!user) return sendError(res, 'User not found', 404);
  user.resume = `/uploads/${req.file.filename}`;
  await user.save();
  return res.apiSuccess({ resume: user.resume }, 'Resume uploaded');
});
