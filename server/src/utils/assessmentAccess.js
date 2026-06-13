const ASSESSMENT_ACCESS_KEYS = [
  'technical',
  'aptitude',
  'coding',
  'mockInterview',
];

const DEFAULT_ASSESSMENT_ACCESS = Object.freeze({
  technical: false,
  aptitude: false,
  coding: false,
  mockInterview: false,
});

function normalizeAssessmentAccess(value = {}) {
  const source = value?.toObject ? value.toObject() : value;

  return ASSESSMENT_ACCESS_KEYS.reduce((access, key) => {
    access[key] = source?.[key] === true;
    return access;
  }, {});
}

function mergeAssessmentAccess(current, updates) {
  const merged = normalizeAssessmentAccess(current);

  ASSESSMENT_ACCESS_KEYS.forEach((key) => {
    if (typeof updates?.[key] === 'boolean') {
      merged[key] = updates[key];
    }
  });

  return merged;
}

function hasAnyAssessmentAccess(value) {
  return Object.values(normalizeAssessmentAccess(value)).some(Boolean);
}

module.exports = {
  ASSESSMENT_ACCESS_KEYS,
  DEFAULT_ASSESSMENT_ACCESS,
  normalizeAssessmentAccess,
  mergeAssessmentAccess,
  hasAnyAssessmentAccess,
};
