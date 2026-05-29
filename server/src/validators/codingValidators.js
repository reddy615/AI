const mongoose = require('mongoose');
const { body, query, param } = require('express-validator');

function isCodingChallengeId(value) {
  return mongoose.isValidObjectId(value) || String(value || '').startsWith('local-coding-');
}

const listChallengesValidator = [
  query('language').optional().isString().trim(),
  query('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  query('tag').optional().isString().trim(),
  query('limit').optional().isInt({ min: 1, max: 50 }),
];

const runSubmissionValidator = [
  body('challengeId').custom(isCodingChallengeId).withMessage('Valid challenge id required'),
  body('language').isString().trim().notEmpty().withMessage('Language required'),
  body('sourceCode').isString().notEmpty().withMessage('Source code is required'),
];

const createChallengeValidator = [
  body('title').isString().trim().notEmpty(),
  body('prompt').isString().trim().notEmpty(),
  body('starterCode').isString().notEmpty(),
  body('language').isString().trim().notEmpty(),
  body('difficulty').isIn(['easy', 'medium', 'hard']),
  body('testCases').optional().isArray(),
];

const getChallengeValidator = [
  param('id').custom(isCodingChallengeId).withMessage('Valid challenge id required'),
];

module.exports = { listChallengesValidator, runSubmissionValidator, getChallengeValidator, createChallengeValidator };
