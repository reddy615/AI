const assert = require('node:assert');
const http = require('node:http');
const { test, before, after } = require('node:test');

process.env.RESEND_API_KEY ||= 're_test_key';
process.env.MAIL_FROM ||= 'test@example.com';

const app = require('../src/app');
const { signAccessToken } = require('../src/utils/jwt');
const { LOCAL_USERS } = require('../src/config/localUsers');

const adminToken = signAccessToken({
  id: 'local-admin',
  role: 'admin',
  ver: 0,
});

function adminRequestOptions(options = {}) {
  return {
    ...options,
    headers: {
      Authorization: `Bearer ${adminToken}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  };
}

let server;
let baseUrl;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', (err) => {
      if (err) return reject(err);
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(() => {
  server.close();
});

test('GET /health returns valid JSON payload', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.headers.get('content-type').includes('application/json'), true);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(typeof body.status === 'string');
  assert.ok(body.mongodb && typeof body.mongodb.readyState === 'number');
});

test('GET /ready returns readiness response', async () => {
  const res = await fetch(`${baseUrl}/ready`);
  const body = await res.json();
  assert.ok('success' in body);
  assert.ok('status' in body);
  assert.ok('mongodb' in body);
});

test('GET / returns the app landing page or health fallback', async () => {
  const res = await fetch(`${baseUrl}/`);
  const text = await res.text();
  assert.equal(res.status, 200);
  assert.ok(text.includes('Server running') || text.toLowerCase().startsWith('<!doctype html>'));
});

test('GET /api/unknown returns not found JSON', async () => {
  const res = await fetch(`${baseUrl}/api/unknown`);
  const body = await res.json();
  assert.equal(res.status, 404);
  assert.equal(body.success, false);
  assert.ok(body.message.includes('Route not found'));
});

test('GET /api/resume/history returns unauthorized without token', async () => {
  const res = await fetch(`${baseUrl}/api/resume/history`);
  const body = await res.json();
  assert.equal(res.status, 401);
  assert.equal(body.success, false);
  assert.ok(body.message.toLowerCase().includes('token'));
});

test('POST /api/resume/analyze returns unauthorized without token', async () => {
  const res = await fetch(`${baseUrl}/api/resume/analyze`, { method: 'POST' });
  const body = await res.json();
  assert.equal(res.status, 401);
  assert.equal(body.success, false);
  assert.ok(body.message.toLowerCase().includes('token'));
});

test('centralized assessment management lists and searches local users', async () => {
  const summaryResponse = await fetch(
    `${baseUrl}/api/admin/assessment-access/summary`,
    adminRequestOptions()
  );
  const summaryBody = await summaryResponse.json();

  assert.equal(summaryResponse.status, 200);
  assert.equal(summaryBody.data.summary.totalUsers, LOCAL_USERS.length);
  assert.equal(
    summaryBody.data.summary.assessments.technical.usersWithAccess,
    1
  );

  const usersResponse = await fetch(
    `${baseUrl}/api/admin/users?search=a81866526`,
    adminRequestOptions()
  );
  const usersBody = await usersResponse.json();

  assert.equal(usersResponse.status, 200);
  assert.equal(usersBody.data.total, 1);
  assert.equal(usersBody.data.users[0].id, 'local-user');
});

test('centralized assessment permissions save partial and bulk updates', async () => {
  const originalAccess = new Map(
    LOCAL_USERS.map((user) => [user.id, { ...user.assessmentAccess }])
  );

  try {
    const userUpdateResponse = await fetch(
      `${baseUrl}/api/admin/users/local-user/assessment-access`,
      adminRequestOptions({
        method: 'PUT',
        body: JSON.stringify({
          assessmentAccess: { coding: true },
        }),
      })
    );
    const userUpdateBody = await userUpdateResponse.json();

    assert.equal(userUpdateResponse.status, 200);
    assert.equal(userUpdateBody.data.assessmentAccess.coding, true);
    assert.equal(userUpdateBody.data.assessmentAccess.technical, false);

    const bulkResponse = await fetch(
      `${baseUrl}/api/admin/assessment-access/bulk`,
      adminRequestOptions({
        method: 'PUT',
        body: JSON.stringify({ enabled: true }),
      })
    );
    const bulkBody = await bulkResponse.json();

    assert.equal(bulkResponse.status, 200);
    assert.equal(bulkBody.data.matchedUsers, LOCAL_USERS.length);
    assert.equal(
      bulkBody.data.summary.assessments.mockInterview.usersWithAccess,
      LOCAL_USERS.length
    );
    assert.equal(
      LOCAL_USERS.every((user) => Object.values(user.assessmentAccess).every(Boolean)),
      true
    );
  } finally {
    for (const [userId, assessmentAccess] of originalAccess) {
      await fetch(
        `${baseUrl}/api/admin/users/${userId}/assessment-access`,
        adminRequestOptions({
          method: 'PUT',
          body: JSON.stringify({ assessmentAccess }),
        })
      );
    }
  }
});
