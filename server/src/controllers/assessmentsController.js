const asyncHandler = require('../utils/asyncHandler');
const Assessment = require('../models/Assessment');
const { sendError } = require('../utils/apiResponse');
const mongoose = require('mongoose');

exports.listActiveAssessments = asyncHandler(async (req, res) => {
  const assessments = await Assessment.find({ active: true })
    .sort({ order: 1, createdAt: -1 })
    .lean();

  return res.apiSuccess({ assessments }, 'Assessments loaded');
});

exports.getAssessment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return sendError(res, 'Invalid assessment id', 400);
  }

  const assessment = await Assessment.findById(id).lean();
  if (!assessment) {
    return sendError(res, 'Assessment not found', 404);
  }

  if (!assessment.active) {
    return sendError(res, 'Assessment is not active', 403);
  }

  return res.apiSuccess({ assessment }, 'Assessment loaded');
});
