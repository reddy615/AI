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
const { LOCAL_USERS, updateLocalUser } = require('../config/localUsers');
const { listLocalLeaderboard, getLocalUserProgress, upsertLocalUserProgress } = require('../config/localGamification');
const { listLocalInterviewSessionsByUser } = require('../config/localInterviews');

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

function buildLocalQuestions() {
  return [
    {
      id: 'local-question-1',
      module: 'technical',
      title: 'Explain a system you built and the tradeoffs you made.',
      prompt: 'Describe a project you shipped, the architecture decisions you made, and what you would improve next time.',
    },
    {
      id: 'local-question-2',
      module: 'behavioral',
      title: 'Tell me about a difficult challenge you solved under pressure.',
      prompt: 'Use a concrete example and explain how you handled the outcome.',
    },
    {
      id: 'local-question-3',
      module: 'hr',
      title: 'Why do you want to work here?',
      prompt: 'Connect your goals to the role and the product you want to build.',
    },
  ];
}

function buildLocalUsers(search = '', role, isActive, limit = 25, page = 1) {
  const queryText = String(search || '').toLowerCase();
  let users = LOCAL_USERS.map((user) => ({
    id: user.id,
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    preferredLanguage: user.preferredLanguage || 'en',
  }));

  if (queryText) {
    users = users.filter((user) => user.name.toLowerCase().includes(queryText) || user.email.toLowerCase().includes(queryText));
  }

  if (role) {
    users = users.filter((user) => user.role === role);
  }

  if (isActive === 'true') users = users.filter((user) => user.isActive);
  if (isActive === 'false') users = users.filter((user) => !user.isActive);

  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const total = users.length;
  const start = (safePage - 1) * safeLimit;

  return {
    users: users.slice(start, start + safeLimit).map((user) => ({
      ...user,
      xp: getLocalUserProgress(user.id)?.xp || 0,
      level: getLocalUserProgress(user.id)?.level || 1,
      streak: getLocalUserProgress(user.id)?.streak || 0,
      badges: getLocalUserProgress(user.id)?.badges || [],
    })),
    total,
    page: safePage,
    limit: safeLimit,
  };
}

function buildLocalSummary() {
  const leaderboard = listLocalLeaderboard();
  const users = LOCAL_USERS;
  const activeUserCount = users.filter((user) => user.isActive).length;
  const adminCount = users.filter((user) => user.role === 'admin').length;
  const summary = {
    userCount: users.length,
    activeUserCount,
    adminCount,
    questionCount: 3,
    aiQuestionCount: 0,
    attemptCount: 0,
    codingCount: 0,
    interviewCount: 0,
    progressCount: users.length,
    averageXp: Math.round(leaderboard.reduce((sum, entry) => sum + (entry.xp || 0), 0) / Math.max(leaderboard.length, 1)),
  };

  return { summary, leaderboard };
}

exports.getSummary = asyncHandler(async (req, res) => {
  if (!isMongoReady()) {
    return res.apiSuccess(buildLocalSummary(), 'Admin summary loaded');
  }

  const [userCount, activeUserCount, adminCount, questionCount, aiQuestionCount, attemptCount, codingCount, interviewCount, progressCount] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'admin' }),
    Question.countDocuments(),
    AIQuestion.countDocuments(),
    Attempt.countDocuments(),
    CodingAttempt.countDocuments(),
    MockInterviewSession.countDocuments(),
    UserProgress.countDocuments(),
  ]);

  const leaderboard = await getLeaderboard(10);
  const averageXpAggregate = progressCount
    ? await UserProgress.aggregate([{ $group: { _id: null, averageXp: { $avg: '$xp' } } }])
    : [];
  const averageXp = Math.round(averageXpAggregate?.[0]?.averageXp || 0);

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
        averageXp,
      },
      leaderboard,
    },
    'Admin summary loaded'
  );
});

exports.listUsers = asyncHandler(async (req, res) => {
  if (!isMongoReady()) {
    const { search = '', role, isActive, limit = 25, page = 1 } = req.query;
    const localUsers = buildLocalUsers(search, role, isActive, limit, page);
    return res.apiSuccess(localUsers, 'Users loaded');
  }

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
  const [users, total] = await Promise.all([
    User.find(query)
      .select('name email role isActive preferredLanguage createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    User.countDocuments(query),
  ]);

  const progressByUser = await UserProgress.find({ user: { $in: users.map((user) => user._id) } }).lean();
  const progressMap = new Map(progressByUser.map((item) => [String(item.user), item]));

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

  if (!isMongoReady()) {
    const updates = {};
    if (typeof role === 'string') updates.role = role;
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (typeof preferredLanguage === 'string') updates.preferredLanguage = preferredLanguage;
    if (typeof name === 'string') updates.name = name;

    const updated = updateLocalUser(id, updates);
    if (!updated) return sendError(res, 'User not found', 404);

    return res.apiSuccess(
      {
        user: {
          id: String(updated.id),
          name: updated.name,
          email: updated.email,
          role: updated.role,
          isActive: updated.isActive,
          preferredLanguage: updated.preferredLanguage,
        },
      },
      'User updated'
    );
  }

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

  if (!isMongoReady()) {
    const questions = buildLocalQuestions().filter((question) => !module || question.module === module).slice(0, safeLimit);
    return res.apiSuccess({ questions }, 'Questions loaded');
  }

  const model = source === 'ai' ? AIQuestion : Question;
  const query = {};
  if (module) query.module = module;

  const questions = await model.find(query).sort({ createdAt: -1 }).limit(safeLimit).lean();
  return res.apiSuccess({ questions }, 'Questions loaded');
});

exports.listInterviews = asyncHandler(async (req, res) => {
  if (!isMongoReady()) {
    const sessions = listLocalInterviewSessionsByUser('local-admin');
    return res.apiSuccess({ sessions }, 'Interview sessions loaded');
  }

  const sessions = await MockInterviewSession.find({})
    .populate('user', 'name email role preferredLanguage')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return res.apiSuccess({ sessions }, 'Interview sessions loaded');
});

exports.getReports = asyncHandler(async (req, res) => {
  if (!isMongoReady()) {
    const leaderboard = listLocalLeaderboard();
    return res.apiSuccess(
      {
        reports: {
          leaderboard,
          topUsers: leaderboard.slice(0, 5).map((entry) => ({
            user: {
              name: entry.name,
              email: entry.email,
              preferredLanguage: entry.preferredLanguage,
            },
            xp: entry.xp,
            level: entry.level,
            streak: entry.streak,
          })),
          generatedAt: new Date().toISOString(),
        },
      },
      'Platform reports loaded'
    );
  }

  const [leaderboard, topUsers] = await Promise.all([
    getLeaderboard(10),
    UserProgress.find({}).sort({ xp: -1 }).limit(5).populate('user', 'name email preferredLanguage').lean(),
  ]);

  return res.apiSuccess(
    {
      reports: {
        leaderboard,
        topUsers,
        generatedAt: new Date().toISOString(),
      },
    },
    'Platform reports loaded'
  );
});