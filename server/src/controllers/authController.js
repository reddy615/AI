const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const { sendError } = require('../utils/apiResponse');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { serializeUserProfile } = require('../utils/userProfile');
const { ensureAuthUsersSeeded } = require('../seed/ensureAuthUsersSeeded');

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
  try {
    // ===== DEBUG: Log incoming request =====
    console.log("=============== REGISTER CONTROLLER START ===============");
    console.log("REGISTER BODY:", req.body);

    const { name, email, password } = req.body;

    if (!isDatabaseReady()) {
      console.error("DATABASE NOT READY");
      return sendError(res, 'Database unavailable', 503);
    }

    // ===== DEBUG: Database ready =====
    console.log("Database is ready, mongoose state:", mongoose.connection.readyState);

    // ===== DEBUG: Hash password =====
    console.log("Generating salt and hashing password...");
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    console.log("Password hashed successfully");

    // ===== DEBUG: Check existing user =====
    console.log("Checking for existing user with email:", email);
    const existing = await User.findOne({ email });
    if (existing) {
      console.log("User already exists with email:", email);
      return sendError(res, 'Email already in use', 400);
    }
    console.log("No existing user found, proceeding with creation");

    // ===== DEBUG: Create user =====
    console.log("Creating user...");
    const user = await User.create({ name, email, password: hash });
    console.log("User created successfully:", user._id);
    console.log("User document:", JSON.stringify({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    }, null, 2));

    // ===== DEBUG: Issue tokens =====
    console.log("Issuing tokens...");
    const tokens = issueTokens(user);
    console.log("Tokens issued successfully");

    // ===== DEBUG: Set refresh cookie =====
    console.log("Setting refresh cookie...");
    setRefreshCookie(res, tokens.refreshToken);
    console.log("Refresh cookie set");

    // ===== DEBUG: Serialize user profile =====
    console.log("Creating user profile...");
    const result = attachAuthPayload(res, user, tokens, 'Registered successfully');
    console.log("Profile created successfully");
    console.log("=============== REGISTER CONTROLLER SUCCESS ===============");
    return result;

  } catch (error) {
    // ===== CATCH: Full error logging =====
    console.error("=============== REGISTER CONTROLLER ERROR ===============");
    console.error("REGISTER CONTROLLER ERROR:", error);
    console.error("STACK:", error.stack);
    console.error("ERROR MESSAGE:", error.message);
    console.error("ERROR NAME:", error.name);
    console.error("ERROR CODE:", error.code);
    console.error("FULL ERROR:", JSON.stringify(error, null, 2));
    
    // Log validation errors if they exist
    if (error.errors) {
      console.error("VALIDATION ERRORS:", error.errors);
    }

    // Log the original request body for debugging
    console.error("REQUEST BODY AT ERROR:", req.body);
    console.error("=============== END ERROR DETAILS ===============");

    // Return the REAL error instead of generic message
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!isDatabaseReady()) {
    return sendError(res, 'Database unavailable', 503);
  }

  let user = await User.findOne({ email });
  if (!user) {
    await ensureAuthUsersSeeded();
    user = await User.findOne({ email });
  }

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
  if (!isDatabaseReady()) {
    return sendError(res, 'Database unavailable', 503);
  }

  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  return res.apiSuccess(serializeUserProfile(user), 'Profile loaded');
});

exports.refresh = asyncHandler(async (req, res) => {
  if (!isDatabaseReady()) {
    return sendError(res, 'Database unavailable', 503);
  }

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
  if (!isDatabaseReady()) {
    return sendError(res, 'Database unavailable', 503);
  }

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
