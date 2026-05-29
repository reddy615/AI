const User = require('../models/User');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const { sendError } = require('../utils/apiResponse');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { findLocalUserByEmail, findLocalUserById } = require('../config/localUsers');

function buildTokenPayload(user) {
  return { id: String(user._id || user.id || user.email), role: user.role, ver: user.refreshTokenVersion };
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
      user: {
        id: String(user._id || user.id || user.email),
        name: user.name,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage || 'en',
        resume: user.resume,
      },
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
  console.log('[auth:login] request received', { email });

  const localUser = findLocalUserByEmail(email);
  if (localUser && localUser.password === password) {
    const tokens = issueTokens(localUser);
    setRefreshCookie(res, tokens.refreshToken);
    console.log('[auth:login] local user authenticated', { email, userId: localUser.id });
    return attachAuthPayload(res, localUser, tokens, 'Login successful');
  }

  try {
    const user = await User.findOne({ email });
    if (user && user.isActive && typeof user.password === 'string' && user.password) {
      const match = await bcrypt.compare(password, user.password);
      if (!match) return sendError(res, 'Invalid credentials', 400);
      const tokens = issueTokens(user);
      setRefreshCookie(res, tokens.refreshToken);
      console.log('[auth:login] database user authenticated', { email, userId: String(user._id) });
      return attachAuthPayload(res, user, tokens, 'Login successful');
    }
  } catch (error) {
    console.warn('[auth:login] database lookup failed, falling back to local user store', { email, error: error.message });
  }

  if (!localUser || localUser.password !== password) {
    return sendError(res, 'Invalid credentials', 400);
  }

  const tokens = issueTokens(localUser);
  setRefreshCookie(res, tokens.refreshToken);
  console.log('[auth:login] local fallback authenticated', { email, userId: localUser.id });
  return attachAuthPayload(res, localUser, tokens, 'Login successful');
});

exports.me = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
      return res.apiSuccess(
        {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          preferredLanguage: user.preferredLanguage || 'en',
          resume: user.resume,
          isActive: user.isActive,
        },
        'Profile loaded'
      );
    }
  } catch (error) {
    // Fall back to local user storage below.
  }

  const localUser = findLocalUserById(req.user.id);
  if (!localUser) return sendError(res, 'User not found', 404);
  return res.apiSuccess(
    {
      id: String(localUser.id),
      name: localUser.name,
      email: localUser.email,
      role: localUser.role,
      preferredLanguage: localUser.preferredLanguage || 'en',
      resume: localUser.resume,
      isActive: localUser.isActive,
    },
    'Profile loaded'
  );
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

  try {
    const user = await User.findById(decoded.id);
    if (user && user.isActive) {
      if (typeof decoded.ver === 'number' && decoded.ver !== user.refreshTokenVersion) {
        return sendError(res, 'Refresh token expired', 401);
      }

      const tokens = issueTokens(user);
      setRefreshCookie(res, tokens.refreshToken);
      return attachAuthPayload(res, user, tokens, 'Token refreshed');
    }
  } catch (error) {
    // Fall back to local user storage below.
  }

  const localUser = findLocalUserById(decoded.id);
  if (!localUser || !localUser.isActive) return sendError(res, 'Unauthorized', 401);
  if (typeof decoded.ver === 'number' && decoded.ver !== localUser.refreshTokenVersion) {
    return sendError(res, 'Refresh token expired', 401);
  }

  const tokens = issueTokens(localUser);
  setRefreshCookie(res, tokens.refreshToken);
  return attachAuthPayload(res, localUser, tokens, 'Token refreshed');
});

exports.logout = asyncHandler(async (req, res) => {
  const incoming = req.cookies?.refreshToken || req.body?.refreshToken;
  if (incoming) {
    try {
      const decoded = verifyRefreshToken(incoming);
      try {
        const user = await User.findById(decoded.id);
        if (user) {
          user.refreshTokenVersion += 1;
          await user.save();
        }
      } catch (error) {
        const localUser = findLocalUserById(decoded.id);
        if (localUser) {
          localUser.refreshTokenVersion += 1;
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
