const { body, param } = require('express-validator');
const { ASSESSMENT_ACCESS_KEYS } = require('../utils/assessmentAccess');

const assessmentUserIdValidator = [
  param('id')
    .custom((value) => /^[a-f\d]{24}$/i.test(value) || /^local-[a-z\d_-]+$/i.test(value))
    .withMessage('Valid user id is required'),
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
  updateAssessmentAccessValidator,
  bulkAssessmentAccessValidator,
};
