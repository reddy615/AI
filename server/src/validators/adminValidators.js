const { body, param } = require('express-validator');
const { ASSESSMENT_ACCESS_KEYS } = require('../utils/assessmentAccess');
const QUIZ_ASSESSMENT_KEYS = ['technical', 'aptitude', 'coding', 'mockInterview'];

const assessmentUserIdValidator = [
  param('id')
    .custom((value) => /^[a-f\d]{24}$/i.test(value) || /^local-[a-z\d_-]+$/i.test(value))
    .withMessage('Valid user id is required'),
];

const assessmentIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Valid assessment id is required'),
];

const createAssessmentValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().isString(),
  body('accessKey').isIn(QUIZ_ASSESSMENT_KEYS).withMessage('Invalid assessment access key'),
  body('module')
    .optional()
    .isIn(['aptitude', 'reasoning', 'verbal'])
    .withMessage('Invalid module'),
  body('category').optional().isString(),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Invalid difficulty'),
  body('count').optional().isInt({ min: 1, max: 100 }).withMessage('Count must be between 1 and 100'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive number'),
  body('passingScore').optional().isInt({ min: 0, max: 100 }).withMessage('Passing score must be between 0 and 100'),
  body('topics').optional().isArray().withMessage('Topics must be an array'),
  body('topics.*').optional().isString().withMessage('Topic must be a string'),
  body('questions').optional().isArray().withMessage('Questions must be an array'),
  body('questions.*.text').optional().isString(),
  body('questions.*.options').optional().isArray().withMessage('Question options must be an array'),
  body('questions.*.correctAnswer').optional().isInt({ min: 0 }).withMessage('Correct answer must be a non-negative integer'),
  body('questions.*.marks').optional().isInt({ min: 1 }).withMessage('Question marks must be a positive integer'),
  body('active').optional().isBoolean().withMessage('Active must be a boolean'),
];

const updateAssessmentValidator = [
  ...assessmentIdValidator,
  body('title').optional().trim().notEmpty().withMessage('Title is required'),
  body('description').optional().isString(),
  body('accessKey').optional().isIn(QUIZ_ASSESSMENT_KEYS).withMessage('Invalid assessment access key'),
  body('module')
    .optional()
    .isIn(['aptitude', 'reasoning', 'verbal'])
    .withMessage('Invalid module'),
  body('category').optional().isString(),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Invalid difficulty'),
  body('count').optional().isInt({ min: 1, max: 100 }).withMessage('Count must be between 1 and 100'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive number'),
  body('passingScore').optional().isInt({ min: 0, max: 100 }).withMessage('Passing score must be between 0 and 100'),
  body('topics').optional().isArray().withMessage('Topics must be an array'),
  body('topics.*').optional().isString().withMessage('Topic must be a string'),
  body('questions').optional().isArray().withMessage('Questions must be an array'),
  body('questions.*.text').optional().isString(),
  body('questions.*.options').optional().isArray().withMessage('Question options must be an array'),
  body('questions.*.correctAnswer').optional().isInt({ min: 0 }).withMessage('Correct answer must be a non-negative integer'),
  body('questions.*.marks').optional().isInt({ min: 1 }).withMessage('Question marks must be a positive integer'),
  body('active').optional().isBoolean().withMessage('Active must be a boolean'),
];

const updateAssessmentAccessValidator = [
  ...assessmentUserIdValidator,
  body('assessmentAccess')
    .isObject()
    .withMessage('Assessment access must be an object')
    .custom((value) => {
      const keys = Object.keys(value || {});
      if (!keys.length) {
        throw new Error('At least one assessment permission is required');
      }

      const invalidKey = keys.find((key) => !ASSESSMENT_ACCESS_KEYS.includes(key));
      if (invalidKey) {
        throw new Error(`Unsupported assessment permission: ${invalidKey}`);
      }

      const invalidValue = keys.find((key) => typeof value[key] !== 'boolean');
      if (invalidValue) {
        throw new Error(`Assessment permission ${invalidValue} must be a boolean`);
      }

      return true;
    }),
];

const bulkAssessmentAccessValidator = [
  body('enabled')
    .isBoolean()
    .withMessage('Enabled must be a boolean'),
];

module.exports = {
  assessmentUserIdValidator,
  assessmentIdValidator,
  createAssessmentValidator,
  updateAssessmentValidator,
  updateAssessmentAccessValidator,
  bulkAssessmentAccessValidator,
};
