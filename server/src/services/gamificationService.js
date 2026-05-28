const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const { getRedisClient } = require('../config/redis');
const { findLocalUserById } = require('../config/localUsers');
const { buildDefaultProgress, getLocalUserProgress, listLocalLeaderboard, upsertLocalUserProgress } = require('../config/localGamification');

const BADGES = [
  { key: 'first-quiz', title: 'First Quiz', description: 'Completed your first quiz attempt.' },
  { key: 'streak-3', title: 'Three-Day Streak', description: 'Learned three days in a row.' },
  { key: 'streak-7', title: 'Weekly Commitment', description: 'Kept a seven-day streak alive.' },
  { key: 'xp-500', title: 'Momentum Builder', description: 'Reached 500 XP.' },
  { key: 'xp-1000', title: 'Top Performer', description: 'Reached 1,000 XP.' },
  { key: 'coding-ace', title: 'Coding Ace', description: 'Scored 90 or higher on a coding submission.' },
  { key: 'interview-pro', title: 'Interview Pro', description: 'Completed an interview session.' },
];

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function diffInCalendarDays(left, right) {
  const leftDay = startOfDay(left);
  const rightDay = startOfDay(right);
  return Math.round((leftDay.getTime() - rightDay.getTime()) / (24 * 60 * 60 * 1000));
}

function getLevelFromXp(xp) {
  return Math.max(1, Math.floor(Number(xp || 0) / 250) + 1);
}

function calculateXp({ source, score = 0, accuracy = 0, durationSeconds = 0 }) {
  const normalizedScore = Math.max(0, Number(score) || 0);
  const normalizedAccuracy = Math.max(0, Number(accuracy) || 0);

  if (source === 'coding') {
    return Math.round(35 + normalizedScore * 1.5 + Math.max(0, 100 - durationSeconds / 5) * 0.1);
  }

  if (source === 'interview') {
    return Math.round(30 + normalizedScore * 1.2 + normalizedAccuracy * 0.4);
  }

  if (source === 'ai-generation') {
    return 10;
  }

  return Math.round(20 + normalizedScore * 1.1 + normalizedAccuracy * 0.5);
}

function badgeExists(progress, badgeKey) {
  return [...(progress.badges || []), ...(progress.achievements || [])].some((badge) => badge.key === badgeKey);
}

function evaluateBadges(progress, activity) {
  const unlocked = [];
  const nextBadges = [];
  const hasBadge = (key) => badgeExists(progress, key);

  if (activity.source === 'quiz' && progress.totalQuizzes >= 1 && !hasBadge('first-quiz')) {
    nextBadges.push(BADGES.find((badge) => badge.key === 'first-quiz'));
  }

  if (progress.streak >= 3 && !hasBadge('streak-3')) nextBadges.push(BADGES.find((badge) => badge.key === 'streak-3'));
  if (progress.streak >= 7 && !hasBadge('streak-7')) nextBadges.push(BADGES.find((badge) => badge.key === 'streak-7'));
  if (progress.xp >= 500 && !hasBadge('xp-500')) nextBadges.push(BADGES.find((badge) => badge.key === 'xp-500'));
  if (progress.xp >= 1000 && !hasBadge('xp-1000')) nextBadges.push(BADGES.find((badge) => badge.key === 'xp-1000'));
  if (activity.source === 'coding' && Number(activity.score || 0) >= 90 && !hasBadge('coding-ace')) nextBadges.push(BADGES.find((badge) => badge.key === 'coding-ace'));
  if (activity.source === 'interview' && !hasBadge('interview-pro')) nextBadges.push(BADGES.find((badge) => badge.key === 'interview-pro'));

  for (const badge of nextBadges.filter(Boolean)) {
    progress.badges.push({ ...badge, earnedAt: new Date() });
    unlocked.push(badge);
  }

  return unlocked;
}

async function ensureProgress(userId) {
  const localUser = findLocalUserById(userId);
  if (localUser) {
    return getLocalUserProgress(localUser.id) || buildDefaultProgress(localUser);
  }

  try {
    let progress = await UserProgress.findOne({ user: userId });
    if (!progress) {
      const user = await User.findById(userId).select('preferredLanguage');
      progress = await UserProgress.create({ user: userId, preferredLanguage: user?.preferredLanguage || 'en' });
    }
    return progress;
  } catch (error) {
    const fallbackUser = findLocalUserById(userId);
    if (fallbackUser) {
      return getLocalUserProgress(fallbackUser.id) || buildDefaultProgress(fallbackUser);
    }
    return buildDefaultProgress({ id: String(userId), preferredLanguage: 'en' });
  }
}

async function recordActivity({ userId, source, score = 0, accuracy = 0, module = '', durationSeconds = 0 }) {
  const now = new Date();
  const xp = calculateXp({ source, score, accuracy, durationSeconds });
  const progress = await ensureProgress(userId);
  if (progress?.user && typeof progress.save !== 'function') {
    const nextProgress = {
      ...progress,
      xp: (progress.xp || 0) + xp,
      level: getLevelFromXp((progress.xp || 0) + xp),
      recentActivities: [{ type: source, source, xp, score, module, createdAt: now }, ...(progress.recentActivities || [])].slice(0, 20),
      lastActivityAt: now,
    };

    const localUpdated = upsertLocalUserProgress(progress.user, nextProgress);
    return {
      progress: localUpdated || nextProgress,
      unlockedBadges: [],
      xpGained: xp,
      levelUp: (localUpdated || nextProgress).level,
    };
  }

  const lastActivityAt = progress.lastActivityAt ? new Date(progress.lastActivityAt) : null;
  const lastDay = lastActivityAt ? startOfDay(lastActivityAt) : null;
  const currentDay = startOfDay(now);

  if (!lastDay) {
    progress.streak = 1;
  } else {
    const dayDiff = diffInCalendarDays(currentDay, lastDay);
    if (dayDiff === 0) {
      progress.streak = Math.max(progress.streak, 1);
    } else if (dayDiff === 1) {
      progress.streak += 1;
    } else if (dayDiff > 1) {
      progress.streak = 1;
    }
  }

  progress.longestStreak = Math.max(progress.longestStreak || 0, progress.streak || 0);
  progress.dailyXp = (progress.lastActivityAt && diffInCalendarDays(currentDay, startOfDay(new Date(progress.lastActivityAt))) === 0)
    ? progress.dailyXp + xp
    : xp;
  progress.xp += xp;
  progress.level = getLevelFromXp(progress.xp);
  progress.lastActivityAt = now;
  progress.recentActivities.unshift({ type: source, source, xp, score, module, createdAt: now });
  progress.recentActivities = progress.recentActivities.slice(0, 20);

  if (source === 'quiz') progress.totalQuizzes += 1;
  if (source === 'coding') progress.totalCodingAttempts += 1;
  if (source === 'interview') progress.totalInterviews += 1;
  if (source === 'ai-generation') progress.totalAiGenerations += 1;

  const unlockedBadges = evaluateBadges(progress, { source, score, accuracy, module });
  await progress.save();

  const redis = getRedisClient();
  if (redis) {
    const leaderboardKeys = await redis.keys('gamification:leaderboard:*');
    const recommendationKeys = await redis.keys(`recommendations:${userId}:*`);
    const keysToRemove = [...leaderboardKeys, ...recommendationKeys];
    if (keysToRemove.length) {
      await redis.del(keysToRemove);
    }
  }

  return {
    progress,
    unlockedBadges,
    xpGained: xp,
    levelUp: progress.level,
  };
}

async function getLeaderboard(limit = 10) {
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const redis = getRedisClient();
  const cacheKey = `gamification:leaderboard:${safeLimit}`;

  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  try {
    const progress = await UserProgress.find({})
      .sort({ xp: -1, longestStreak: -1, updatedAt: -1 })
      .limit(safeLimit)
      .populate('user', 'name email role preferredLanguage')
      .lean();

    const leaderboard = progress.map((item, index) => ({
      rank: index + 1,
      userId: String(item.user?._id || item.user),
      name: item.user?.name || 'Learner',
      email: item.user?.email || '',
      role: item.user?.role || 'user',
      preferredLanguage: item.user?.preferredLanguage || item.preferredLanguage || 'en',
      xp: item.xp || 0,
      level: item.level || getLevelFromXp(item.xp || 0),
      streak: item.streak || 0,
      badges: item.badges || [],
    }));

    if (redis) {
      await redis.set(cacheKey, JSON.stringify(leaderboard), 'EX', Number(process.env.LEADERBOARD_CACHE_TTL_SECONDS || 300));
    }

    return leaderboard;
  } catch (error) {
    return listLocalLeaderboard().slice(0, safeLimit);
  }
}

async function getProgress(userId) {
  const progress = await ensureProgress(userId);
  const nextLevelXp = progress.level * 250;
  return {
    progress,
    nextLevelXp,
    xpToNextLevel: Math.max(0, nextLevelXp - progress.xp),
  };
}

module.exports = {
  BADGES,
  calculateXp,
  getLeaderboard,
  getProgress,
  recordActivity,
};