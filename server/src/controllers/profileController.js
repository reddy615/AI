const mongoose = require('mongoose');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendError } = require('../utils/apiResponse');
const { uploadBuffer, deleteAsset, hasCloudinaryConfig } = require('../config/cloudinary');
const { serializeUserProfile } = require('../utils/userProfile');
const { findLocalUserById, findLocalUserByEmail, updateLocalUser } = require('../config/localUsers');

function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

async function findDatabaseUser(req, { includePassword = false } = {}) {
  if (isDatabaseReady()) {
    const query = User.findById(req.user.id);
    if (!includePassword) {
      query.select('-password');
    }

    return query;
  }

  const localUser = findLocalUserById(req.user.id) || findLocalUserByEmail(req.user.email);
  if (!localUser) {
    return null;
  }

  if (includePassword) {
    return localUser;
  }

  const { password, ...safeUser } = localUser;
  return safeUser;
}

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await findDatabaseUser(req);
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  return res.apiSuccess({ user: serializeUserProfile(user) }, 'Profile loaded');
});

exports.updatePreferences = asyncHandler(async (req, res) => {
  const { preferredLanguage } = req.body;
  const allowedLanguages = new Set(['en', 'es', 'fr', 'hi']);

  if (preferredLanguage && !allowedLanguages.has(preferredLanguage)) {
    return sendError(res, 'Unsupported language', 400);
  }

  const user = await findDatabaseUser(req, { includePassword: true });
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  if (preferredLanguage) {
    if (isDatabaseReady()) {
      user.preferredLanguage = preferredLanguage;
      await user.save();
    } else {
      const updated = updateLocalUser(user.id, { preferredLanguage });
      if (!updated) {
        return sendError(res, 'Failed to update preferences', 500);
      }
      user.preferredLanguage = updated.preferredLanguage;
    }
  }

  return res.apiSuccess({ preferredLanguage: user.preferredLanguage || 'en' }, 'Preferences updated');
});

exports.uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) return sendError(res, 'No file uploaded', 400);

  let user;
  user = await findDatabaseUser(req, { includePassword: true });
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  const originalName = req.file.originalname || 'resume';

  if (!isDatabaseReady()) {
    const localResumeUrl = `local-resume://${encodeURIComponent(originalName)}`;
    const updated = updateLocalUser(user.id, {
      resume: localResumeUrl,
      resumeUrl: localResumeUrl,
      resumeFileName: originalName,
      resumePublicId: null,
      resumeResourceType: 'raw',
    });

    if (!updated) {
      return sendError(res, 'Failed to save local resume details', 500);
    }

    return res.apiSuccess(
      {
        resume: updated.resume,
        resumeUrl: updated.resumeUrl,
        resumeFileName: updated.resumeFileName,
        resumePublicId: updated.resumePublicId,
        resumeResourceType: updated.resumeResourceType,
      },
      'Resume uploaded'
    );
  }

  if (!hasCloudinaryConfig()) {
    return sendError(res, 'Cloudinary is not configured for resume uploads', 500);
  }

  if (user.resumePublicId) {
    try {
      await deleteAsset(user.resumePublicId, user.resumeResourceType || 'raw');
    } catch (deleteError) {
      console.warn('[profile:resume] unable to delete previous resume from Cloudinary', deleteError.message);
    }
  }

  let uploadResult;
  try {
    uploadResult = await uploadBuffer(req.file.buffer, {
      folder: 'ai-interview/resumes',
      resource_type: 'raw',
      public_id: `resume-${String(user._id || user.id)}-${Date.now()}`,
      use_filename: false,
      unique_filename: false,
      overwrite: true,
      access_mode: 'public',
    });
  } catch (error) {
    console.error('[profile:resume] cloud upload failed', {
      userId: String(user._id || user.id),
      error: error.message,
    });
    return sendError(res, 'Failed to upload resume to cloud storage', 502);
  }

  if (!uploadResult?.secure_url) {
    return sendError(res, 'Upload completed but no resume URL was returned', 502);
  }

  user.resume = uploadResult.secure_url;
  user.resumeUrl = uploadResult.secure_url;
  user.resumePublicId = uploadResult.public_id;
  user.resumeResourceType = uploadResult.resource_type || 'raw';
  user.resumeFileName = originalName;

  await user.save();

  return res.apiSuccess(
    {
      resume: user.resume,
      resumeUrl: user.resumeUrl,
      resumeFileName: user.resumeFileName,
      resumePublicId: user.resumePublicId,
      resumeResourceType: user.resumeResourceType,
    },
    'Resume uploaded'
  );
});

exports.deleteResume = asyncHandler(async (req, res) => {
  const user = await findDatabaseUser(req, { includePassword: true });
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  if (!isDatabaseReady()) {
    const updated = updateLocalUser(user.id, {
      resume: null,
      resumeUrl: null,
      resumePublicId: null,
      resumeFileName: null,
      resumeResourceType: null,
    });

    if (!updated) {
      return sendError(res, 'Failed to remove local resume details', 500);
    }

    return res.apiSuccess({ resume: null }, 'Resume removed');
  }

  if (user.resumePublicId) {
    try {
      await deleteAsset(user.resumePublicId, user.resumeResourceType || 'raw');
    } catch (deleteError) {
      console.warn('[profile:resume] unable to delete resume from Cloudinary', deleteError.message);
    }
  }

  user.resume = null;
  user.resumeUrl = null;
  user.resumePublicId = null;
  user.resumeFileName = null;
  user.resumeResourceType = null;
  await user.save();

  return res.apiSuccess({ resume: null }, 'Resume removed');
});
