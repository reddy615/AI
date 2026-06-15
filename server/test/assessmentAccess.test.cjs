const assert = require('node:assert');
const { test } = require('node:test');
const User = require('../src/models/User');
const {
  normalizeAssessmentAccess,
  mergeAssessmentAccess,
  hasAnyAssessmentAccess,
} = require('../src/utils/assessmentAccess');
const {
  requireAssessmentAccess,
  resolveQuizAssessment,
} = require('../src/middleware/assessmentAccess');

test('User schema defaults every assessment permission to false', () => {
  const user = new User({
    name: 'Assessment User',
    email: 'assessment@example.com',
    password: 'hashed-password',
  });

  assert.deepEqual(normalizeAssessmentAccess(user.assessmentAccess), {
    technical: false,
    aptitude: false,
    coding: false,
    mockInterview: false,
    'Practice Test': false,
  });
});

test('legacy users without assessment access normalize safely', () => {
  assert.deepEqual(normalizeAssessmentAccess(undefined), {
    technical: false,
    aptitude: false,
    coding: false,
    mockInterview: false,
    'Practice Test': false,
  });
  assert.equal(hasAnyAssessmentAccess(undefined), false);
});

test('partial assessment updates preserve existing grants and revoke selected access', () => {
  const updated = mergeAssessmentAccess(
    {
      technical: true,
      aptitude: true,
      coding: false,
      mockInterview: false,
      'Practice Test': false,
    },
    {
      aptitude: false,
      coding: true,
    }
  );

  assert.deepEqual(updated, {
    technical: true,
    aptitude: false,
    coding: true,
    mockInterview: false,
    'Practice Test': false,
  });
  assert.equal(hasAnyAssessmentAccess(updated), true);
});

test('assessment middleware denies a local user without permission', async () => {
  const middleware = requireAssessmentAccess('coding');
  const req = { user: { id: 'local-user', role: 'user' } };
  let responseStatus;
  let responseBody;
  let nextCalled = false;
  const res = {
    status(status) {
      responseStatus = status;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(responseStatus, 403);
  assert.equal(responseBody.code, 'ASSESSMENT_ACCESS_RESTRICTED');
});

test('assessment middleware allows administrators', async () => {
  const middleware = requireAssessmentAccess('technical');
  let nextCalled = false;

  await middleware(
    { user: { id: 'local-admin', role: 'admin' } },
    {},
    () => {
      nextCalled = true;
    }
  );

  assert.equal(nextCalled, true);
});

test('quiz modules map to the correct assessment permission', () => {
  assert.equal(resolveQuizAssessment({ query: { module: 'aptitude' } }), 'aptitude');
  assert.equal(resolveQuizAssessment({ query: { module: 'reasoning' } }), 'technical');
  assert.equal(resolveQuizAssessment({ body: { module: 'verbal' } }), 'technical');
});
