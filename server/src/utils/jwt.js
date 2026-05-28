const jwt = require('jsonwebtoken');

const DEFAULT_DEV_JWT_SECRET = 'ai-interview-dev-secret';

function resolveSecret(preferredSecret) {
  if (preferredSecret && !preferredSecret.startsWith('dev_')) {
    return preferredSecret;
  }

  return process.env.JWT_SECRET || DEFAULT_DEV_JWT_SECRET;
}

function signAccessToken(payload) {
  return jwt.sign(payload, resolveSecret(process.env.ACCESS_TOKEN_SECRET), {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, resolveSecret(process.env.REFRESH_TOKEN_SECRET), {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, resolveSecret(process.env.ACCESS_TOKEN_SECRET), {
    algorithms: ['HS256'],
  });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, resolveSecret(process.env.REFRESH_TOKEN_SECRET), {
    algorithms: ['HS256'],
  });
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
