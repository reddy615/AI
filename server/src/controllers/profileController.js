const mongoose = require('mongoose');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendError } = require('../utils/apiResponse');
const { uploadBuffer, deleteAsset, hasCloudinaryConfig } = require('../config/cloudinary');
const { serializeUserProfile } = require('../utils/userProfile');

function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

async function findDatabaseUser(req, { includePassword = false } = {}) {
  if (!isDatabaseReady()) {
    return null;
  }

  const query = User.findById(req.user.id);
  if (!includePassword) {
    query.select('-password');
  }

  return query;
}

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await findDatabaseUser(req);
  if (!user) {
    return sendError(res, 'Database unavailable', 503);
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
    return sendError(res, 'Database unavailable', 503);
  }

  if (preferredLanguage) {
    user.preferredLanguage = preferredLanguage;
    await user.save();
  }

  return res.apiSuccess({ preferredLanguage: user.preferredLanguage || 'en' }, 'Preferences updated');
});

exports.uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) return sendError(res, 'No file uploaded', 400);

  const user = await findDatabaseUser(req, { includePassword: true });
  if (!user) {
    return sendError(res, 'Database unavailable', 503);
  }

  const originalName = req.file.originalname || 'resume';
  const mimeType = req.file.mimetype || null;

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
      // Allow Cloudinary to preserve the original filename. We do not set a custom public_id
      // so Cloudinary will emit a public_id we can store for later deletion.
      use_filename: true,
      unique_filename: false,
      preserve_original_filename: true,
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

  console.log('[profile:resume] cloudinary upload result', {
    userId: String(user._id || user.id),
    secureUrl: uploadResult?.secure_url || null,
    publicId: uploadResult?.public_id || null,
    resourceType: uploadResult?.resource_type || null,
    originalName,
  });

  if (!uploadResult?.secure_url) {
    return sendError(res, 'Upload completed but no resume URL was returned', 502);
  }

  user.resume = uploadResult.secure_url;
  user.resumeUrl = uploadResult.secure_url;
  user.resumePublicId = uploadResult.public_id;
  user.resumeResourceType = uploadResult.resource_type || 'raw';
  user.resumeFileName = originalName;
  user.resumeMimeType = mimeType;

  await user.save();

  const savedUser = await User.findById(user._id).select('name email resume resumeUrl resumeFileName resumePublicId resumeResourceType resumeMimeType');
  const serialized = serializeUserProfile(savedUser || user);

  return res.apiSuccess(
    {
      resume: serialized.resume,
      resumeUrl: serialized.resumeUrl,
      resumeFileName: serialized.resumeFileName,
      resumePublicId: serialized.resumePublicId,
      resumeResourceType: serialized.resumeResourceType,
    },
    'Resume uploaded'
  );
});

exports.deleteResume = asyncHandler(async (req, res) => {
  const user = await findDatabaseUser(req, { includePassword: true });
  if (!user) {
    return sendError(res, 'Database unavailable', 503);
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
  user.resumeMimeType = null;
  await user.save();

  return res.apiSuccess({ resume: null }, 'Resume removed');
});
