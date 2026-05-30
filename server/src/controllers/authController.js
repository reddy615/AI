const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const { sendError } = require('../utils/apiResponse');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { serializeUserProfile } = require('../utils/userProfile');
const { ensureAuthUsersSeeded } = require('../seed/ensureAuthUsersSeeded');
const {
  findLocalUserByEmail,
  findLocalUserById,
  updateLocalUser,
  upsertLocalUser,
} = require('../config/localUsers');

function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

function buildTokenPayload(user) {
  const userId = user?._id || user?.id || user?.email;
  if (!userId) {
    throw new Error('User id is required to issue tokens');
  }

  return { id: String(userId), role: user.role, ver: user.refreshTokenVersion };
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
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  if (isDatabaseReady()) {
    const existing = await User.findOne({ email });
    if (existing) return sendError(res, 'Email already in use', 400);

    const user = await User.create({ name, email, password: hash });
    const tokens = issueTokens(user);
    setRefreshCookie(res, tokens.refreshToken);
    return attachAuthPayload(res, user, tokens, 'Registered successfully');
  }

  const localExisting = findLocalUserByEmail(email);
  if (localExisting) return sendError(res, 'Email already in use', 400);

  const user = upsertLocalUser({
    id: email,
    name,
    email,
    password: hash,
    role: 'user',
    preferredLanguage: 'en',
    isActive: true,
    refreshTokenVersion: 0,
  });
  const tokens = issueTokens(user);
  setRefreshCookie(res, tokens.refreshToken);
  return attachAuthPayload(res, user, tokens, 'Registered successfully');
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  let user = null;

  if (isDatabaseReady()) {
    user = await User.findOne({ email });
    if (!user) {
      await ensureAuthUsersSeeded();
      user = await User.findOne({ email });
    }
  }

  if (!user) {
    user = findLocalUserByEmail(email);
  }

  if (!user || !user.isActive || typeof user.password !== 'string' || !user.password) {
    return sendError(res, 'Invalid credentials', 400);
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) return sendError(res, 'Invalid credentials', 400);

  if (!isDatabaseReady() && user.id) {
    updateLocalUser(user.id, {
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
      isActive: true,
    });
  }

  const tokens = issueTokens(user);
  setRefreshCookie(res, tokens.refreshToken);
  return attachAuthPayload(res, user, tokens, 'Login successful');
});

exports.me = asyncHandler(async (req, res) => {
  if (!isDatabaseReady()) {
    const localUser = findLocalUserById(req.user.id) || findLocalUserByEmail(req.user.email);
    if (!localUser) {
      return sendError(res, 'User not found', 404);
    }

    return res.apiSuccess(serializeUserProfile(localUser), 'Profile loaded');
  }

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

  let user = null;
  if (isDatabaseReady()) {
    user = await User.findById(decoded.id);
  } else {
    user = findLocalUserById(decoded.id);
  }

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
      if (isDatabaseReady()) {
        const user = await User.findById(decoded.id);
        if (user) {
          user.refreshTokenVersion += 1;
          await user.save();
        }
      } else {
        const localUser = findLocalUserById(decoded.id);
        if (localUser) {
          updateLocalUser(localUser.id, {
            refreshTokenVersion: (localUser.refreshTokenVersion || 0) + 1,
          });
        }
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
