const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { LOCAL_USERS } = require('../config/localUsers');

async function ensureAuthUsersSeeded() {
  const results = [];

  for (const defaultUser of LOCAL_USERS) {
    const existing = await User.findOne({ email: defaultUser.email }).select('_id email');
    if (existing) {
      results.push({ email: defaultUser.email, action: 'exists' });
      continue;
    }

    const hash = await bcrypt.hash(defaultUser.password, 10);
    await User.create({
      name: defaultUser.name,
      email: defaultUser.email,
      password: hash,
      role: defaultUser.role || 'user',
      preferredLanguage: defaultUser.preferredLanguage || 'en',
      isActive: true,
      refreshTokenVersion: 0,
    });

    results.push({ email: defaultUser.email, action: 'seeded' });
  }

  return results;
}

module.exports = {
  ensureAuthUsersSeeded,
};