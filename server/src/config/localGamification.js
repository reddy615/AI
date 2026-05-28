const { LOCAL_USERS } = require('./localUsers');

const localProgressStore = new Map();

function buildDefaultProgress(user) {
  return {
    user: user.id,
    xp: 0,
    level: 1,
    streak: 0,
    longestStreak: 0,
    dailyXp: 0,
    lastActivityAt: null,
    badges: [],
    achievements: [],
    recentActivities: [],
    totalQuizzes: 0,
    totalCodingAttempts: 0,
    totalInterviews: 0,
    totalAiGenerations: 0,
    preferredLanguage: user.preferredLanguage || 'en',
  };
}

function getLocalUserProgress(userId) {
  const user = LOCAL_USERS.find((item) => item.id === userId || item.email === userId);
  if (!user) return null;

  if (!localProgressStore.has(user.id)) {
    localProgressStore.set(user.id, buildDefaultProgress(user));
  }

  return localProgressStore.get(user.id);
}

function upsertLocalUserProgress(userId, patch) {
  const current = getLocalUserProgress(userId);
  if (!current) return null;

  const next = { ...current, ...patch };
  localProgressStore.set(current.user, next);
  return next;
}

function listLocalLeaderboard() {
  return LOCAL_USERS.map((user, index) => {
    const progress = getLocalUserProgress(user.id) || buildDefaultProgress(user);
    return {
      rank: index + 1,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferredLanguage: progress.preferredLanguage || user.preferredLanguage || 'en',
      xp: progress.xp || 0,
      level: progress.level || 1,
      streak: progress.streak || 0,
      badges: progress.badges || [],
    };
  });
}

module.exports = {
  buildDefaultProgress,
  getLocalUserProgress,
  listLocalLeaderboard,
  upsertLocalUserProgress,
};