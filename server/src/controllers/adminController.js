const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const Question = require('../models/Question');
const AIQuestion = require('../models/AIQuestion');
const Attempt = require('../models/Attempt');
const CodingAttempt = require('../models/CodingAttempt');
const MockInterviewSession = require('../models/MockInterviewSession');
const { sendError } = require('../utils/apiResponse');
const { getLeaderboard } = require('../services/gamificationService');
const { ensureAuthUsersSeeded } = require('../seed/ensureAuthUsersSeeded');

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

function toCount(value) {
  return Number(value) || 0;
}

async function runAdminQuery(label, task, fallback) {
  if (!isMongoReady()) {
    return fallback;
  }

  try {
    const result = await task();
    return result ?? fallback;
  } catch (error) {
    return fallback;
  }
}

exports.getSummary = asyncHandler(async (req, res) => {
  const settled = await Promise.allSettled([
    runAdminQuery('summary.userCount', () => User.countDocuments(), 0),
    runAdminQuery('summary.activeUserCount', () => User.countDocuments({ isActive: true }), 0),
    runAdminQuery('summary.adminCount', () => User.countDocuments({ role: 'admin' }), 0),
    runAdminQuery('summary.questionCount', () => Question.countDocuments(), 0),
    runAdminQuery('summary.aiQuestionCount', () => AIQuestion.countDocuments(), 0),
    runAdminQuery('summary.attemptCount', () => Attempt.countDocuments(), 0),
    runAdminQuery('summary.codingCount', () => CodingAttempt.countDocuments(), 0),
    runAdminQuery('summary.interviewCount', () => MockInterviewSession.countDocuments(), 0),
    runAdminQuery('summary.progressCount', () => UserProgress.countDocuments(), 0),
    runAdminQuery('summary.leaderboard', () => getLeaderboard(10), []),
    runAdminQuery(
      'summary.averageXp',
      async () => {
        const averageXpAggregate = await UserProgress.aggregate([{ $group: { _id: null, averageXp: { $avg: '$xp' } } }]);
        return Math.round(averageXpAggregate?.[0]?.averageXp || 0);
      },
      0
    ),
  ]);

  const [userCount, activeUserCount, adminCount, questionCount, aiQuestionCount, attemptCount, codingCount, interviewCount, progressCount, leaderboard, averageXp] = settled.map((item, index) => {
    if (item.status === 'fulfilled') {
      return item.value;
    }

    return index === 9 ? [] : 0;
  });

  let resolvedUserCount = toCount(userCount);
  let resolvedActiveUserCount = toCount(activeUserCount);
  let resolvedAdminCount = toCount(adminCount);
  let resolvedLeaderboard = leaderboard;
  let resolvedAverageXp = toCount(averageXp);

  if (isMongoReady() && resolvedUserCount === 0) {
    await ensureAuthUsersSeeded();

    const [seededUserCount, seededActiveUserCount, seededAdminCount, seededLeaderboard] = await Promise.all([
      runAdminQuery('summary.seededUserCount', () => User.countDocuments(), 0),
      runAdminQuery('summary.seededActiveUserCount', () => User.countDocuments({ isActive: true }), 0),
      runAdminQuery('summary.seededAdminCount', () => User.countDocuments({ role: 'admin' }), 0),
      runAdminQuery('summary.seededLeaderboard', () => getLeaderboard(10), []),
    ]);

    resolvedUserCount = toCount(seededUserCount);
    resolvedActiveUserCount = toCount(seededActiveUserCount);
    resolvedAdminCount = toCount(seededAdminCount);
    resolvedLeaderboard = Array.isArray(seededLeaderboard) ? seededLeaderboard : [];
    resolvedAverageXp = resolvedUserCount ? resolvedAverageXp : 0;
  }

  return res.apiSuccess(
    {
      summary: {
        userCount: resolvedUserCount,
        activeUserCount: resolvedActiveUserCount,
        adminCount: resolvedAdminCount,
        questionCount,
        aiQuestionCount,
        attemptCount,
        codingCount,
        interviewCount,
        progressCount,
        averageXp: resolvedAverageXp,
      },
      leaderboard: resolvedLeaderboard,
    },
    'Admin summary loaded'
  );
});

exports.listUsers = asyncHandler(async (req, res) => {
  const { search = '', role, isActive, limit = 25, page = 1 } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];
  }

  if (role) query.role = role;
  if (isActive === 'true') query.isActive = true;
  if (isActive === 'false') query.isActive = false;

  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);

  const [usersResult, totalResult] = await Promise.allSettled([
    runAdminQuery(
      'users.list',
      () => User.find(query)
        .select('name email role isActive preferredLanguage createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      []
    ),
    runAdminQuery('users.total', () => User.countDocuments(query), 0),
  ]);

  const users = usersResult.status === 'fulfilled' ? usersResult.value : [];
  const total = totalResult.status === 'fulfilled' ? totalResult.value : 0;

  let resolvedUsers = users;
  let resolvedTotal = total;

  if (isMongoReady() && resolvedUsers.length === 0 && !search && !role && isActive === undefined) {
    await ensureAuthUsersSeeded();

    const [seededUsersResult, seededTotalResult] = await Promise.allSettled([
      runAdminQuery(
        'users.seededList',
        () => User.find(query)
          .select('name email role isActive preferredLanguage createdAt updatedAt')
          .sort({ createdAt: -1 })
          .skip((safePage - 1) * safeLimit)
          .limit(safeLimit)
          .lean(),
        []
      ),
      runAdminQuery('users.seededTotal', () => User.countDocuments(query), 0),
    ]);

    resolvedUsers = seededUsersResult.status === 'fulfilled' ? seededUsersResult.value : [];
    resolvedTotal = seededTotalResult.status === 'fulfilled' ? seededTotalResult.value : 0;
  }

  const progressByUser = resolvedUsers.length
    ? await runAdminQuery('users.progress', () => UserProgress.find({ user: { $in: resolvedUsers.map((user) => user._id) } }).lean(), [])
    : [];
  const progressMap = new Map((progressByUser || []).map((item) => [String(item.user), item]));

  const data = resolvedUsers.map((user) => {
    const progress = progressMap.get(String(user._id));
    return {
      ...user,
      xp: progress?.xp || 0,
      level: progress?.level || 1,
      streak: progress?.streak || 0,
      badges: progress?.badges || [],
    };
  });

  return res.apiSuccess({ users: data, total: resolvedTotal, page: safePage, limit: safeLimit }, 'Users loaded');
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role, isActive, preferredLanguage, name } = req.body;

  const user = await User.findById(id);
  if (!user) return sendError(res, 'User not found', 404);

  if (typeof role === 'string') user.role = role;
  if (typeof isActive === 'boolean') user.isActive = isActive;
  if (typeof preferredLanguage === 'string') user.preferredLanguage = preferredLanguage;
  if (typeof name === 'string') user.name = name;

  user.refreshTokenVersion += 1;
  await user.save();

  return res.apiSuccess(
    {
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        preferredLanguage: user.preferredLanguage,
      },
    },
    'User updated'
  );
});

exports.listQuestions = asyncHandler(async (req, res) => {
  const { source = 'quiz', module, limit = 25 } = req.query;
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);

  const model = source === 'ai' ? AIQuestion : Question;
  const query = {};
  if (module) query.module = module;

  const questions = await runAdminQuery(
    `questions.list.${source}`,
    () => model.find(query).sort({ createdAt: -1 }).limit(safeLimit).lean(),
    []
  );
  return res.apiSuccess({ questions }, 'Questions loaded');
});

exports.listInterviews = asyncHandler(async (req, res) => {
  const sessions = await runAdminQuery(
    'interviews.list',
    () => MockInterviewSession.find({})
      .populate('user', 'name email role preferredLanguage')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    []
  );

  return res.apiSuccess({ sessions }, 'Interview sessions loaded');
});

exports.getReports = asyncHandler(async (req, res) => {
  const [leaderboard, topUsers] = await Promise.allSettled([
    runAdminQuery('reports.leaderboard', () => getLeaderboard(10), []),
    runAdminQuery(
      'reports.topUsers',
      () => UserProgress.find({}).sort({ xp: -1 }).limit(5).populate('user', 'name email preferredLanguage').lean(),
      []
    ),
  ]);

  return res.apiSuccess(
    {
      reports: {
        leaderboard: leaderboard.status === 'fulfilled' ? leaderboard.value : [],
        topUsers: topUsers.status === 'fulfilled' ? topUsers.value : [],
        generatedAt: new Date().toISOString(),
      },
    },
    'Platform reports loaded'
  );
});