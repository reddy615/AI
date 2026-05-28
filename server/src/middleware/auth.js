const User = require('../models/User');
const { verifyAccessToken } = require('../utils/jwt');
const { findLocalUserById } = require('../config/localUsers');

module.exports = async function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    if (!decoded?.id) {
      return res.status(401).json({ success: false, message: 'Token invalid' });
    }

    try {
      const user = await User.findById(decoded.id).select('role isActive refreshTokenVersion email name');
      if (user && user.isActive) {
        if (typeof decoded.ver === 'number' && decoded.ver !== user.refreshTokenVersion) {
          return res.status(401).json({ success: false, message: 'Token expired' });
        }

        req.user = {
          id: String(user._id),
          role: user.role,
          email: user.email,
          name: user.name,
          tokenVersion: user.refreshTokenVersion,
        };

        return next();
      }
    } catch (error) {
      // Fall through to local users.
    }

    const localUser = findLocalUserById(decoded.id);
    if (!localUser || !localUser.isActive) {
      return res.status(401).json({ success: false, message: 'User not authorized' });
    }

    if (typeof decoded.ver === 'number' && decoded.ver !== localUser.refreshTokenVersion) {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }

    req.user = {
      id: String(localUser.id),
      role: localUser.role,
      email: localUser.email,
      name: localUser.name,
      tokenVersion: localUser.refreshTokenVersion,
    };

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};
