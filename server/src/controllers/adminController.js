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

const ADMIN_DEBUG_LOGS = process.env.ADMIN_DEBUG_LOGS === 'true';

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

function logAdmin(stage, label, details = {}) {
  if (!ADMIN_DEBUG_LOGS) {
    return;
  }

  console.info(`[admin:${stage}] ${label}`, {
    mongoState: mongoose.connection.readyState,
    ...details,
  });
}

function toCount(value) {
  return Number(value) || 0;
}

async function runAdminQuery(label, task, fallback) {
  if (!isMongoReady()) {
    logAdmin('skip', label, { reason: 'mongo-not-connected' });
    return fallback;
  }

  logAdmin('start', label);

  try {
    const result = await task();
    const summary = Array.isArray(result)
      ? { count: result.length, sample: result[0] || null }
      : result && typeof result === 'object'
        ? { keys: Object.keys(result), sample: result }
        : { value: result };

    logAdmin('success', label, summary);
    return result ?? fallback;
  } catch (error) {
    logAdmin('error', label, {
      name: error.name,
      message: error.message,
    });
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

    logAdmin('error', `summary.settled.${index}`, {
      name: item.reason?.name,
      message: item.reason?.message,
    });

    return index === 9 ? [] : 0;
  });

  return res.apiSuccess(
    {
      summary: {
        userCount,
        activeUserCount,
        adminCount,
        questionCount,
        aiQuestionCount,
        attemptCount,
        codingCount,
        interviewCount,
        progressCount,
        averageXp: toCount(averageXp),
      },
      leaderboard,
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

  const progressByUser = users.length
    ? await runAdminQuery('users.progress', () => UserProgress.find({ user: { $in: users.map((user) => user._id) } }).lean(), [])
    : [];
  const progressMap = new Map((progressByUser || []).map((item) => [String(item.user), item]));

  const data = users.map((user) => {
    const progress = progressMap.get(String(user._id));
    return {
      ...user,
      xp: progress?.xp || 0,
      level: progress?.level || 1,
      streak: progress?.streak || 0,
      badges: progress?.badges || [],
    };
  });

  return res.apiSuccess({ users: data, total, page: safePage, limit: safeLimit }, 'Users loaded');
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