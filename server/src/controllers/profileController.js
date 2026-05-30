const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendError } = require('../utils/apiResponse');
const { findLocalUserById, updateLocalUser } = require('../config/localUsers');
const { uploadBuffer, deleteAsset, hasCloudinaryConfig } = require('../config/cloudinary');
const { serializeUserProfile } = require('../utils/userProfile');

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
      return res.apiSuccess({ user: serializeUserProfile(user) }, 'Profile loaded');
    }
  } catch (error) {
    // Fall back to local users.
  }

  const localUser = findLocalUserById(req.user.id);
  if (!localUser) return sendError(res, 'User not found', 404);
  return res.apiSuccess(
    {
      user: serializeUserProfile(localUser),
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

      const originalName = req.file.originalname || 'resume';
      const uploadResult = await uploadBuffer(req.file.buffer, {
        folder: 'ai-interview/resumes',
        resource_type: 'raw',
        public_id: `resume-${String(user._id || user.id)}-${Date.now()}`,
        use_filename: false,
        unique_filename: false,
        overwrite: true,
        access_mode: 'public',
      });

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
    }
  } catch (error) {
    // Fall back to local users.
  }

  const localUser = updateLocalUser(req.user.id, {
    resume: null,
    resumeUrl: null,
    resumeFileName: null,
    resumePublicId: null,
    resumeResourceType: null,
  });
  if (!localUser) return sendError(res, 'User not found', 404);
  return res.apiSuccess({ resume: localUser.resume }, 'Resume uploaded');
});

exports.deleteResume = asyncHandler(async (req, res) => {
  try {
    const user = await findDatabaseUser(req, { includePassword: true });
    if (user) {
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
    }
  } catch (error) {
    // Fall back to local users.
  }

  const localUser = updateLocalUser(req.user.id, {
    resume: null,
    resumeUrl: null,
    resumeFileName: null,
    resumePublicId: null,
    resumeResourceType: null,
  });
  if (!localUser) return sendError(res, 'User not found', 404);
  return res.apiSuccess({ resume: null }, 'Resume removed');
});
