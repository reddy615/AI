const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const { sendError } = require('../utils/apiResponse');
const { getRedisClient } = require('../config/redis');
const { recordActivity } = require('../services/gamificationService');
const { generateModuleQuestions } = require('../seed/questions');

const localQuizQuestionStore = new Map();
const localQuizAttemptStore = new Map();

function createLocalQuizId(module) {
  return `local-quiz-${module}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildLocalQuestionPayload(question, module) {
  const id = createLocalQuizId(module);
  const storedQuestion = {
    ...question,
    _id: id,
    id,
  };

  localQuizQuestionStore.set(id, storedQuestion);

  return {
    id,
    text: question.text,
    options: question.options,
    explanation: question.explanation,
    marks: question.marks,
    negativeMarks: question.negativeMarks,
    topic: question.topic,
    difficulty: question.difficulty,
    category: question.category,
  };
}

function buildLocalQuizQuestions(module, difficulty, category, count) {
  const sourceQuestions = generateModuleQuestions(module, Math.max(count, 10));
  const filteredQuestions = sourceQuestions.filter((question) => {
    if (difficulty && question.difficulty !== difficulty) return false;
    if (category && question.category !== category) return false;
    return true;
  });

  const selectedQuestions = (filteredQuestions.length ? filteredQuestions : sourceQuestions).slice(0, count);
  return selectedQuestions.map((question) => buildLocalQuestionPayload(question, module));
}

function getLocalQuizQuestion(questionId) {
  return localQuizQuestionStore.get(String(questionId)) || null;
}

function scoreQuizAnswers(questionsById, answers) {
  let score = 0;
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  const answerRecords = [];

  for (const questionId of Object.keys(answers)) {
    const selectedValue = answers[questionId];
    const question = questionsById.get(questionId);

    if (!question) {
      skipped += 1;
      continue;
    }

    const isSkipped = selectedValue === null || selectedValue === undefined;
    if (isSkipped) {
      skipped += 1;
      answerRecords.push({
        questionId: question._id,
        topic: question.topic,
        selectedIndex: null,
        correctIndex: question.correctIndex,
        marks: question.marks,
        negativeMarks: question.negativeMarks,
      });
      continue;
    }

    const selectedIndex = Number(selectedValue);
    const isCorrect = selectedIndex === question.correctIndex;

    if (isCorrect) {
      score += question.marks;
      correct += 1;
    } else {
      score -= question.negativeMarks || 0;
      wrong += 1;
    }

    answerRecords.push({
      questionId: question._id,
      topic: question.topic,
      selectedIndex,
      correctIndex: question.correctIndex,
      marks: question.marks,
      negativeMarks: question.negativeMarks,
    });
  }

  return { score, correct, wrong, skipped, answerRecords };
}

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
  let payload = [];

  try {
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

    if (questionIds.length) {
      const shuffledIds = questionIds.sort(() => Math.random() - 0.5).slice(0, safeCount);
      const questions = await Question.find({ _id: { $in: shuffledIds } }).lean();

      payload = questions.map((question) => ({
        id: question._id,
        text: question.text,
        options: question.options,
        explanation: question.explanation,
        marks: question.marks,
        negativeMarks: question.negativeMarks,
        topic: question.topic,
        difficulty: question.difficulty,
        category: question.category,
      }));
    }
  } catch (error) {
    console.warn('Quiz database unavailable, using local fallback', error.message);
  }

  if (!payload.length) {
    payload = buildLocalQuizQuestions(module, difficulty, category, safeCount);
  }

  if (!payload.length) {
    return res.apiSuccess({ questions: [], count: 0 }, 'No questions available');
  }

  return res.apiSuccess({ questions: payload, count: payload.length }, 'Quiz loaded');
});

// Submit answers, calculate score, save Attempt
exports.submitAnswers = asyncHandler(async (req, res) => {
  const { module, difficulty, category, durationSeconds, answers } = req.body;
  if (!answers || typeof answers !== 'object') return sendError(res, 'Answers required', 400);

  const dbQuestionIds = Object.keys(answers).filter((id) => mongoose.isValidObjectId(id));
  const localQuestionIds = Object.keys(answers).filter((id) => !mongoose.isValidObjectId(id));

  const questionsById = new Map();

  if (dbQuestionIds.length && mongoose.connection.readyState === 1) {
    try {
      const questions = await Question.find({ _id: { $in: dbQuestionIds.map((id) => new mongoose.Types.ObjectId(id)) } }).select('correctIndex marks negativeMarks topic');
      questions.forEach((question) => questionsById.set(String(question._id), question));
    } catch (error) {
      console.warn('Quiz database unavailable during submit, using local cache', error.message);
    }
  }

  localQuestionIds.forEach((questionId) => {
    const question = getLocalQuizQuestion(questionId);
    if (question) {
      questionsById.set(questionId, question);
    }
  });

  const { score, correct, wrong, skipped, answerRecords } = scoreQuizAnswers(questionsById, answers);
  const totalQuestions = questionsById.size;

  if (!dbQuestionIds.length || mongoose.connection.readyState !== 1) {
    const attemptId = `local-attempt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const attempt = {
      _id: attemptId,
      id: attemptId,
      user: req.user.id,
      module,
      difficulty,
      category,
      totalQuestions,
      answers: answerRecords,
      score,
      correctCount: correct,
      wrongCount: wrong,
      skippedCount: skipped,
      durationSeconds,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    localQuizAttemptStore.set(attemptId, attempt);
    return res.apiSuccess({ attemptId, score, correct, wrong, skipped, gamification: null }, 'Assessment submitted');
  }

  const attempt = await Attempt.create({
    user: req.user.id,
    module,
    difficulty,
    category,
    totalQuestions,
    answers: answerRecords,
    score,
    correctCount: correct,
    wrongCount: wrong,
    skippedCount: skipped,
    durationSeconds,
  });

  const accuracy = totalQuestions ? Math.round((correct / totalQuestions) * 100) : 0;
  let gamification = null;

  try {
    gamification = await recordActivity({
      userId: req.user.id,
      source: 'quiz',
      score,
      accuracy,
      module,
      durationSeconds: Number(durationSeconds) || 0,
    });
  } catch (error) {
    console.warn('Gamification update skipped for quiz submission', error.message);
  }

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
  let attempt = null;

  if (mongoose.isValidObjectId(id) && mongoose.connection.readyState === 1) {
    attempt = await Attempt.findById(id).populate('answers.questionId').lean();
  }

  if (!attempt) {
    attempt = localQuizAttemptStore.get(String(id)) || null;
  }

  if (!attempt) return sendError(res, 'Not found', 404);
  if (String(attempt.user) !== String(req.user.id)) return sendError(res, 'Forbidden', 403);

  const byTopic = {};
  for (const a of attempt.answers) {
    const q = a.questionId;
    const topic = a.topic || q?.topic || 'General';
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

