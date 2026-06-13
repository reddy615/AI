const { normalizeAssessmentAccess } = require('./assessmentAccess');

function getResumeFileName(user) {
  if (!user) {
    return null;
  }

  if (user.resumeFileName) {
    return user.resumeFileName;
  }

  const resumeUrl = user.resumeUrl || user.resume || '';
  if (!resumeUrl) {
    return null;
  }

  try {
    const cleanPath = new URL(resumeUrl, 'https://example.com').pathname;
    const fallbackName = cleanPath.split('/').filter(Boolean).pop() || '';
    return decodeURIComponent(fallbackName) || null;
  } catch (error) {
    const fallbackName = String(resumeUrl).split('/').filter(Boolean).pop() || '';
    return decodeURIComponent(fallbackName) || null;
  }
}

function serializeUserProfile(user) {
  if (!user) {
    return null;
  }

  const plainUser = user.toObject ? user.toObject() : { ...user };
  const resumeUrl = plainUser.resumeUrl || plainUser.resume || null;

  return {
    id: String(plainUser._id || plainUser.id || plainUser.email),
    name: plainUser.name,
    email: plainUser.email,
    role: plainUser.role,
    preferredLanguage: plainUser.preferredLanguage || 'en',
    isActive: plainUser.isActive,
    assessmentAccess: normalizeAssessmentAccess(plainUser.assessmentAccess),
    resume: resumeUrl,
    resumeUrl,
    resumeFileName: getResumeFileName(plainUser),
    resumeMimeType: plainUser.resumeMimeType || null,
    resumePublicId: plainUser.resumePublicId || null,
    resumeResourceType: plainUser.resumeResourceType || null,
  };
}

module.exports = {
  getResumeFileName,
  serializeUserProfile,
};
