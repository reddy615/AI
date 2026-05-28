const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const { sendError } = require('../utils/apiResponse');
const { getRedisClient } = require('../config/redis');
const { recordActivity } = require('../services/gamificationService');
const { generateModuleQuestions } = require('../seed/questions');

async function ensureQuizQuestions(module, match, redis, poolKey) {
  const existingCount = await Question.countDocuments(match);
  if (existingCount > 0) {
    return true;
  }

  const generatedQuestions = generateModuleQuestions(module, 40);
  if (!generatedQuestions.length) {
    return false;
  }

  await Question.insertMany(generatedQuestions);

  if (redis) {
    await redis.del(poolKey);
  }

  return true;
}

// Start a quiz: fetch randomized questions based on query filters
exports.startQuiz = asyncHandler(async (req, res) => {
  const { module = 'aptitude', difficulty, category, count = 10 } = req.query;
  const safeCount = Math.min(Number(count) || 10, 50);
  const match = { module };
  if (difficulty) match.difficulty = difficulty;
  if (category) match.category = category;

  const redis = getRedisClient();
  const poolKey = `quiz:pool:${module}:${difficulty || 'all'}:${category || 'all'}`;
  let questionIds = [];

  if (redis) {
    const cachedPool = await redis.get(poolKey);
    if (cachedPool) {
      questionIds = JSON.parse(cachedPool);
    }
  }

  if (!questionIds.length) {
    questionIds = await Question.distinct('_id', match);
    if (redis) {
      await redis.set(poolKey, JSON.stringify(questionIds), 'EX', 600);
    }
  }

  if (!questionIds.length) {
    const seeded = await ensureQuizQuestions(module, match, redis, poolKey);

    if (seeded) {
      questionIds = await Question.distinct('_id', match);
      if (redis) {
        await redis.set(poolKey, JSON.stringify(questionIds), 'EX', 600);
      }
    }
  }

  if (!questionIds.length) {
    return res.apiSuccess({ questions: [], count: 0 }, 'No questions available');
  }

  const shuffledIds = questionIds.sort(() => Math.random() - 0.5).slice(0, safeCount);
  const questions = await Question.find({ _id: { $in: shuffledIds } }).lean();

  const payload = questions.map(q => ({
    id: q._id,
    text: q.text,
    options: q.options,
    explanation: q.explanation,
    marks: q.marks,
    negativeMarks: q.negativeMarks,
    topic: q.topic,
    difficulty: q.difficulty,
    category: q.category,
  }));

  return res.apiSuccess({ questions: payload, count: payload.length }, 'Quiz loaded');
});

// Submit answers, calculate score, save Attempt
exports.submitAnswers = asyncHandler(async (req, res) => {
  const { module, difficulty, category, durationSeconds, answers } = req.body;
  if (!answers || typeof answers !== 'object') return sendError(res, 'Answers required', 400);

  const qIds = Object.keys(answers)
    .filter((id) => mongoose.isValidObjectId(id))
    .map((id) => new mongoose.Types.ObjectId(id));
  const questions = await Question.find({ _id: { $in: qIds } }).select('correctIndex marks negativeMarks topic');

  let score = 0, correct = 0, wrong = 0, skipped = 0;
  const answerRecords = [];

  const qMap = new Map();
  questions.forEach((q) => qMap.set(String(q._id), q));

  for (const qid of Object.keys(answers)) {
    const sel = answers[qid];
    const q = qMap.get(qid);
    if (!q) {
      skipped += 1;
      continue;
    }

    const isSkipped = sel === null || sel === undefined;
    if (isSkipped) {
      skipped += 1;
      answerRecords.push({ questionId: q._id, selectedIndex: null, correctIndex: q.correctIndex, marks: q.marks, negativeMarks: q.negativeMarks });
      continue;
    }

    const selectedIndex = Number(sel);
    const isCorrect = selectedIndex === q.correctIndex;
    if (isCorrect) {
      score += q.marks;
      correct += 1;
    } else {
      score -= q.negativeMarks || 0;
      wrong += 1;
    }

    answerRecords.push({ questionId: q._id, selectedIndex, correctIndex: q.correctIndex, marks: q.marks, negativeMarks: q.negativeMarks });
  }

  const attempt = await Attempt.create({
    user: req.user.id,
    module,
    difficulty,
    category,
    totalQuestions: qIds.length,
    answers: answerRecords,
    score,
    correctCount: correct,
    wrongCount: wrong,
    skippedCount: skipped,
    durationSeconds,
  });

  const accuracy = qIds.length ? Math.round((correct / qIds.length) * 100) : 0;
  const gamification = await recordActivity({
    userId: req.user.id,
    source: 'quiz',
    score,
    accuracy,
    module,
    durationSeconds: Number(durationSeconds) || 0,
  });

  return res.apiSuccess({ attemptId: attempt._id, score, correct, wrong, skipped, gamification }, 'Assessment submitted');
});

// Get user's attempt history
exports.getHistory = asyncHandler(async (req, res) => {
  const attempts = await Attempt.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(100).lean();
  return res.apiSuccess({ attempts }, 'Attempt history loaded');
});

// Get attempt result with analytics
exports.getResult = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const attempt = await Attempt.findById(id).populate('answers.questionId').lean();
  if (!attempt) return sendError(res, 'Not found', 404);
  if (String(attempt.user) !== String(req.user.id)) return sendError(res, 'Forbidden', 403);

  const byTopic = {};
  for (const a of attempt.answers) {
    const q = a.questionId;
    const topic = q?.topic || 'General';
    if (!byTopic[topic]) byTopic[topic] = { correct: 0, wrong: 0, skipped: 0, score: 0, total: 0 };
    byTopic[topic].total += 1;
    if (a.selectedIndex === null || a.selectedIndex === undefined) {
      byTopic[topic].skipped += 1;
      continue;
    }
    if (a.selectedIndex === a.correctIndex) {
      byTopic[topic].correct += 1;
      byTopic[topic].score += a.marks;
    } else {
      byTopic[topic].wrong += 1;
      byTopic[topic].score -= a.negativeMarks || 0;
    }
  }

  return res.apiSuccess({ attempt, analytics: { byTopic } }, 'Result loaded');
});

// Admin: create a question
exports.createQuestion = asyncHandler(async (req, res) => {
  const payload = req.body;
  const q = await Question.create({
    module: payload.module,
    category: payload.category,
    topic: payload.topic,
    difficulty: payload.difficulty,
    text: payload.text,
    options: payload.options.map((option) => ({ text: typeof option === 'string' ? option : option.text })),
    correctIndex: payload.correctIndex,
    explanation: payload.explanation,
    marks: payload.marks ?? 1,
    negativeMarks: payload.negativeMarks ?? 0,
    createdBy: req.user.id,
  });
  return res.apiSuccess({ question: q }, 'Question created', 201);
});

