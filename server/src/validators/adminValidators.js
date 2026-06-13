const { body, param } = require('express-validator');
const { ASSESSMENT_ACCESS_KEYS } = require('../utils/assessmentAccess');

const assessmentUserIdValidator = [
  param('id').isMongoId().withMessage('Valid user id is required'),
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

module.exports = {
  assessmentUserIdValidator,
  updateAssessmentAccessValidator,
};
