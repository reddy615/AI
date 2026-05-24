const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const Question = require('../models/Question');
const AIQuestion = require('../models/AIQuestion');
const Attempt = require('../models/Attempt');
const CodingAttempt = require('../models/CodingAttempt');
const MockInterviewSession = require('../models/MockInterviewSession');
const { sendError } = require('../utils/apiResponse');
const { getLeaderboard } = require('../services/gamificationService');

exports.getSummary = asyncHandler(async (req, res) => {
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

  const questions = await model.find(query).sort({ createdAt: -1 }).limit(safeLimit).lean();
  return res.apiSuccess({ questions }, 'Questions loaded');
});

exports.listInterviews = asyncHandler(async (req, res) => {
  const sessions = await MockInterviewSession.find({})
    .populate('user', 'name email role preferredLanguage')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return res.apiSuccess({ sessions }, 'Interview sessions loaded');
});

exports.getReports = asyncHandler(async (req, res) => {
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