const User = require('../models/User');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const { sendError } = require('../utils/apiResponse');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { serializeUserProfile } = require('../utils/userProfile');

function buildTokenPayload(user) {
  if (!user?._id) {
    throw new Error('MongoDB user id is required to issue tokens');
  }

  return { id: String(user._id), role: user.role, ver: user.refreshTokenVersion };
}

function setRefreshCookie(res, token) {
  const secure = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  if (process.env.COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN;
  }

  res.cookie('refreshToken', token, cookieOptions);
}

function issueTokens(user) {
  const payload = buildTokenPayload(user);
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

function attachAuthPayload(res, user, tokens, message) {
  return res.apiSuccess(
    {
      token: tokens.accessToken,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: serializeUserProfile(user),
    },
    message,
    200
  );
}

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return sendError(res, 'Email already in use', 400);
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  const user = await User.create({ name, email, password: hash });
  const tokens = issueTokens(user);
  setRefreshCookie(res, tokens.refreshToken);
  return attachAuthPayload(res, user, tokens, 'Registered successfully');
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !user.isActive || typeof user.password !== 'string' || !user.password) {
    return sendError(res, 'Invalid credentials', 400);
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) return sendError(res, 'Invalid credentials', 400);

  const tokens = issueTokens(user);
  setRefreshCookie(res, tokens.refreshToken);
  return attachAuthPayload(res, user, tokens, 'Login successful');
});

exports.me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  return res.apiSuccess(serializeUserProfile(user), 'Profile loaded');
});

exports.refresh = asyncHandler(async (req, res) => {
  const incoming = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!incoming) return sendError(res, 'Refresh token required', 401);

  let decoded;
  try {
    decoded = verifyRefreshToken(incoming);
  } catch (error) {
    return sendError(res, 'Refresh token invalid or expired', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    return sendError(res, 'Unauthorized', 401);
  }

  if (typeof decoded.ver === 'number' && decoded.ver !== user.refreshTokenVersion) {
    return sendError(res, 'Refresh token expired', 401);
  }

  const tokens = issueTokens(user);
  setRefreshCookie(res, tokens.refreshToken);
  return attachAuthPayload(res, user, tokens, 'Token refreshed');
});

exports.logout = asyncHandler(async (req, res) => {
  const incoming = req.cookies?.refreshToken || req.body?.refreshToken;
  if (incoming) {
    try {
      const decoded = verifyRefreshToken(incoming);
      const user = await User.findById(decoded.id);
      if (user) {
        user.refreshTokenVersion += 1;
        await user.save();
      }
    } catch (error) {
      // ignore invalid refresh token during logout
    }
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
    sameSite: (process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production') ? 'none' : 'lax',
    domain: process.env.COOKIE_DOMAIN || undefined,
  });

  return res.apiSuccess(null, 'Logged out successfully');
});
