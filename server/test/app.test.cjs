const assert = require('node:assert');
const http = require('node:http');
const { test, before, after } = require('node:test');
const app = require('../src/app');

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
