const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendError } = require('../utils/apiResponse');
const { findLocalUserById, updateLocalUser } = require('../config/localUsers');

async function findDatabaseUser(req, { includePassword = false } = {}) {
  try {
    const byIdQuery = User.findById(req.user.id);
    if (!includePassword) {
      byIdQuery.select('-password');
    }

    const byId = await byIdQuery;
    if (byId) {
      return byId;
    }
  } catch (error) {
    // Fall back to lookup by email when the token id belongs to a local account.
  }

  if (req.user?.email) {
    const byEmailQuery = User.findOne({ email: req.user.email });
    if (!includePassword) {
      byEmailQuery.select('-password');
    }

    return byEmailQuery;
  }

  return null;
}

exports.getProfile = asyncHandler(async (req, res) => {
  try {
    const user = await findDatabaseUser(req);
    if (user) {
      return res.apiSuccess({ user: user.toObject ? user.toObject() : user }, 'Profile loaded');
    }
  } catch (error) {
    // Fall back to local users.
  }

  const localUser = findLocalUserById(req.user.id);
  if (!localUser) return sendError(res, 'User not found', 404);
  return res.apiSuccess(
    {
      user: {
        id: String(localUser.id),
        name: localUser.name,
        email: localUser.email,
        role: localUser.role,
        preferredLanguage: localUser.preferredLanguage || 'en',
        resume: localUser.resume,
        isActive: localUser.isActive,
      },
    },
    'Profile loaded'
  );
});

exports.updatePreferences = asyncHandler(async (req, res) => {
  const { preferredLanguage } = req.body;
  const allowedLanguages = new Set(['en', 'es', 'fr', 'hi']);

  if (preferredLanguage && !allowedLanguages.has(preferredLanguage)) {
    return sendError(res, 'Unsupported language', 400);
  }

  try {
    const user = await findDatabaseUser(req, { includePassword: true });
    if (user) {
      if (preferredLanguage) {
        user.preferredLanguage = preferredLanguage;
        await user.save();
      }

      return res.apiSuccess({ preferredLanguage: user.preferredLanguage || 'en' }, 'Preferences updated');
    }
  } catch (error) {
    // Fall back to local users.
  }

  const localUser = updateLocalUser(req.user.id, preferredLanguage ? { preferredLanguage } : {});
  if (!localUser) return sendError(res, 'User not found', 404);

  return res.apiSuccess({ preferredLanguage: localUser.preferredLanguage || 'en' }, 'Preferences updated');
});

exports.uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) return sendError(res, 'No file uploaded', 400);
  try {
    const user = await findDatabaseUser(req, { includePassword: true });
    if (user) {
      user.resume = `/uploads/${req.file.filename}`;
      await user.save();
      return res.apiSuccess({ resume: user.resume }, 'Resume uploaded');
    }
  } catch (error) {
    // Fall back to local users.
  }

  const localUser = updateLocalUser(req.user.id, { resume: `/uploads/${req.file.filename}` });
  if (!localUser) return sendError(res, 'User not found', 404);
  return res.apiSuccess({ resume: localUser.resume }, 'Resume uploaded');
});
