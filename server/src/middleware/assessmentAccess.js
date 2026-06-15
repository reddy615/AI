const mongoose = require('mongoose');
const User = require('../models/User');
const { findLocalUserById } = require('../config/localUsers');
const { normalizeAssessmentAccess } = require('../utils/assessmentAccess');

function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

function requireAssessmentAccess(accessKeyOrResolver) {
  return async function assessmentAccessMiddleware(req, res, next) {
    try {
      if (req.user?.role === 'admin') {
        return next();
      }

      let accessKey = typeof accessKeyOrResolver === 'function'
        ? accessKeyOrResolver(req)
        : accessKeyOrResolver;

      const assessmentId = req.query?.assessmentId || req.body?.assessmentId;
      if (assessmentId && mongoose.isValidObjectId(assessmentId)) {
        const Assessment = require('../models/Assessment');
        const assessment = await Assessment.findById(assessmentId).select('accessKey').lean();
        if (assessment) {
          accessKey = assessment.accessKey;
        }
      }

      if (!accessKey) {
        return res.status(400).json({
          success: false,
          message: 'Unable to determine the requested assessment type',
        });
      }

      let assessmentAccess;

      if (isDatabaseReady()) {
        const user = await User.findById(req.user.id).select('assessmentAccess').lean();
        if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }
        assessmentAccess = user.assessmentAccess;
      } else {
        assessmentAccess = findLocalUserById(req.user.id)?.assessmentAccess;
      }

      if (!normalizeAssessmentAccess(assessmentAccess)[accessKey]) {
        return res.status(403).json({
          success: false,
          code: 'ASSESSMENT_ACCESS_RESTRICTED',
          message: 'You currently do not have access to this assessment. Please contact the administrator.',
        });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

function resolveQuizAssessment(req) {
  const moduleName = String(req.query?.module || req.body?.module || '').toLowerCase();
  return moduleName === 'aptitude' ? 'aptitude' : 'technical';
}

module.exports = {
  requireAssessmentAccess,
  resolveQuizAssessment,
};
