const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const { sendError } = require('../utils/apiResponse');
const { getRedisClient } = require('../config/redis');
const { recordActivity } = require('../services/gamificationService');
const {
  aggregateTopicAnalytics,
  hydrateAttemptQuestionMetadata,
  scoreQuizAnswers,
  toByTopic,
} = require('../services/quizAnalyticsService');
const { generateModuleQuestions, generateAptitudeQuestionsForTopic, generateReasoningQuestionsForTopic, generateVerbalQuestionsForTopic, getAptitudeTopics, getReasoningTopics } = require('../seed/questions');
const { localQuizQuestionStore, localQuizAttemptStore } = require('../config/localQuizStore');

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

function shuffleQuestions(questions) {
  return [...questions].sort(() => Math.random() - 0.5);
}

function pickUniqueQuestions(questions, count) {
  const seenTexts = new Set();
  const uniqueQuestions = [];

  for (const question of questions) {
    const questionText = String(question?.text || '').trim().toLowerCase();
    if (!questionText || seenTexts.has(questionText)) {
      continue;
    }

    seenTexts.add(questionText);
    uniqueQuestions.push(question);

    if (uniqueQuestions.length >= count) {
      break;
    }
  }

  return uniqueQuestions;
}

function buildLocalQuizQuestions(module, difficulty, category, count) {
  const sourceQuestions = generateModuleQuestions(module, Math.max(count, 10));
  const filteredQuestions = sourceQuestions.filter((question) => {
    if (difficulty && question.difficulty !== difficulty) return false;
    if (category && question.category !== category) return false;
    return true;
  });

  const selectedQuestions = pickUniqueQuestions(filteredQuestions.length ? filteredQuestions : sourceQuestions, count);
  return selectedQuestions.map((question) => buildLocalQuestionPayload(question, module));
}

function buildAptitudePracticeQuestions(perTopicCount = 2) {
  const totalQuestions = getAptitudeTopics().length * perTopicCount;
  const allQuestions = getAptitudeTopics().flatMap((topic, topicIndex) => generateAptitudeQuestionsForTopic(topicIndex, 80));
  const uniqueQuestions = pickUniqueQuestions(shuffleQuestions(allQuestions), totalQuestions);

  return uniqueQuestions.map((question) => buildLocalQuestionPayload(question, 'aptitude'));
}

function buildReasoningPracticeQuestions(perTopicCount = 2) {
  const topicsToUse = getReasoningTopics()
    .map((topic, originalIndex) => ({ ...topic, originalIndex }))
    .sort(() => Math.random() - 0.5)
    .slice(0, 18);

  return topicsToUse.flatMap((topic) => {
    const topicQuestions = generateReasoningQuestionsForTopic(topic.originalIndex, 80);
    const shuffledQuestions = [...topicQuestions].sort(() => Math.random() - 0.5);
    return shuffledQuestions.slice(0, perTopicCount).map((question) => buildLocalQuestionPayload(question, 'reasoning'));
  });
}

function buildVerbalPracticeQuestions(perTopicCount = 2) {
  const topicList = generateModuleQuestions('verbal', 80)
    .reduce((accumulator, question) => {
      if (!accumulator[question.topic]) {
        accumulator[question.topic] = [];
      }
      accumulator[question.topic].push(question);
      return accumulator;
    }, {});

  const topicsToUse = Object.keys(topicList)
    .map((topic, originalIndex) => ({ topic, originalIndex }))
    .sort(() => Math.random() - 0.5)
    .slice(0, 18);

  return topicsToUse.flatMap((entry) => {
    const topicQuestions = generateVerbalQuestionsForTopic(entry.originalIndex, 80);
    const shuffledQuestions = [...topicQuestions].sort(() => Math.random() - 0.5);
    return shuffledQuestions.slice(0, perTopicCount).map((question) => buildLocalQuestionPayload(question, 'verbal'));
  });
}

function getLocalQuizQuestion(questionId) {
  return localQuizQuestionStore.get(String(questionId)) || null;
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

  if (module === 'aptitude') {
    const payload = buildAptitudePracticeQuestions(2);
    return res.apiSuccess({ questions: payload, count: payload.length }, 'Quiz loaded');
  }

  if (module === 'reasoning') {
    const payload = buildReasoningPracticeQuestions(2);
    return res.apiSuccess({ questions: payload, count: payload.length }, 'Quiz loaded');
  }

  if (module === 'verbal') {
    const payload = buildVerbalPracticeQuestions(2);
    return res.apiSuccess({ questions: payload, count: payload.length }, 'Quiz loaded');
  }

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
      const questions = await Question.find({ _id: { $in: dbQuestionIds.map((id) => new mongoose.Types.ObjectId(id)) } })
        .select('module category topic text options correctIndex marks negativeMarks');
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
  const topicAnalytics = aggregateTopicAnalytics([{ module, category, answers: answerRecords }]);

  const isDatabaseAvailable = mongoose.connection.readyState === 1;

  if (!isDatabaseAvailable) {
    const attemptId = `local-attempt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const attempt = {
      _id: attemptId,
      id: attemptId,
      user: req.user.id,
      userId: req.user.id,
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
    return res.apiSuccess({
      attemptId,
      score,
      correct,
      wrong,
      skipped,
      topicAnalytics,
      gamification: null,
    }, 'Assessment submitted');
  }

  const attempt = await Attempt.create({
    user: req.user.id,
    userId: req.user.id,
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

  return res.apiSuccess({
    attemptId: attempt._id,
    score,
    correct,
    wrong,
    skipped,
    topicAnalytics,
    gamification,
  }, 'Assessment submitted');
});

// Get user's attempt history
exports.getHistory = asyncHandler(async (req, res) => {
  const storedAttempts = mongoose.connection.readyState === 1
    ? await Attempt.find({ $or: [{ user: req.user.id }, { userId: req.user.id }] }).sort({ createdAt: -1 }).limit(100).lean()
    : [];
  const localAttempts = Array.from(localQuizAttemptStore.values())
    .filter((attempt) => String(attempt.user || attempt.userId) === String(req.user.id));
  const attempts = await hydrateAttemptQuestionMetadata([...storedAttempts, ...localAttempts]);
  attempts.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  return res.apiSuccess({ attempts: attempts.slice(0, 100) }, 'Attempt history loaded');
});

// Get attempt result with analytics
exports.getResult = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let attempt = null;

  if (mongoose.isValidObjectId(id) && mongoose.connection.readyState === 1) {
    attempt = await Attempt.findById(id).lean();
  }

  if (!attempt) {
    attempt = localQuizAttemptStore.get(String(id)) || null;
  }

  if (!attempt) return sendError(res, 'Not found', 404);
  if (String(attempt.user || attempt.userId) !== String(req.user.id)) return sendError(res, 'Forbidden', 403);

  const [hydratedAttempt] = await hydrateAttemptQuestionMetadata([attempt]);
  const topicAnalytics = aggregateTopicAnalytics([hydratedAttempt]);
  const byTopic = toByTopic(topicAnalytics);

  return res.apiSuccess({
    attempt: hydratedAttempt,
    analytics: { byTopic, topicAnalytics },
  }, 'Result loaded');
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

