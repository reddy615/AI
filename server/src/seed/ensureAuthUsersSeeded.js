const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { LOCAL_USERS } = require('../config/localUsers');

async function ensureAuthUsersSeeded() {
  const results = [];

  for (const defaultUser of LOCAL_USERS) {
    const hash = await bcrypt.hash(defaultUser.password, 10);
    const updateResult = await User.updateOne(
      { email: defaultUser.email },
      {
        $set: {
          name: defaultUser.name,
          email: defaultUser.email,
          password: hash,
          role: defaultUser.role || 'user',
          preferredLanguage: defaultUser.preferredLanguage || 'en',
          isActive: true,
        },
        $setOnInsert: {
          refreshTokenVersion: 0,
        },
      },
      { upsert: true }
    );

    results.push({
      email: defaultUser.email,
      action: updateResult.upsertedCount ? 'seeded' : 'updated',
    });
  }

  return results;
}

module.exports = {
  ensureAuthUsersSeeded,
};