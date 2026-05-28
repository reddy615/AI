const Attempt = require('../models/Attempt');
const CodingAttempt = require('../models/CodingAttempt');
const { findLocalUserById } = require('../config/localUsers');
const { localQuizAttemptStore } = require('../config/localQuizStore');

function buildEmptyAnalytics(userId) {
  const localUser = findLocalUserById(userId);
  return {
    userId,
    quizAttempts: [],
    quizScores: [],
    moduleBreakdown: {},
    codingHistory: [],
    codingLeaderboard: [],
    weakAreas: [],
    summary: {
      totalQuizAttempts: 0,
      totalCodingAttempts: 0,
      averageAccuracy: 0,
      bestQuizScore: 0,
      bestCodingScore: 0,
    },
    source: localUser ? 'local-fallback' : 'empty-fallback',
  };
}

function calculateWeakAreas(attempts) {
  const stats = new Map();

  for (const attempt of attempts) {
    for (const answer of attempt.answers || []) {
      const topic = answer.topic || answer.questionId?.topic || 'General';
      const current = stats.get(topic) || { correct: 0, wrong: 0, skipped: 0, total: 0 };
      current.total += 1;
      if (answer.selectedIndex === null || answer.selectedIndex === undefined) {
        current.skipped += 1;
      } else if (answer.selectedIndex === answer.correctIndex) {
        current.correct += 1;
      } else {
        current.wrong += 1;
      }
      stats.set(topic, current);
    }
  }

  return Array.from(stats.entries())
    .map(([topic, value]) => ({
      topic,
      ...value,
      accuracy: value.total ? Math.round((value.correct / value.total) * 100) : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);
}

async function getUserAnalytics(userId) {
  try {
    const dbQuizAttempts = await Attempt.find({ user: userId }).sort({ createdAt: 1 }).populate('answers.questionId').lean();
    const localQuizAttempts = Array.from(localQuizAttemptStore.values()).filter((attempt) => String(attempt.user) === String(userId));
    const quizAttempts = [...dbQuizAttempts, ...localQuizAttempts].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const codingAttempts = await CodingAttempt.find({ user: userId }).populate('challenge').sort({ createdAt: -1 }).lean();

    const quizScores = quizAttempts.map((attempt) => ({
      date: attempt.createdAt,
      score: attempt.score,
      module: attempt.module,
      correct: attempt.correctCount || 0,
      wrong: attempt.wrongCount || 0,
      skipped: attempt.skippedCount || 0,
    }));

    const moduleBreakdown = quizAttempts.reduce((accumulator, attempt) => {
      const current = accumulator[attempt.module] || { attempts: 0, score: 0, correct: 0, wrong: 0 };
      current.attempts += 1;
      current.score += attempt.score || 0;
      current.correct += attempt.correctCount || 0;
      current.wrong += attempt.wrongCount || 0;
      accumulator[attempt.module] = current;
      return accumulator;
    }, {});

    const codingHistory = codingAttempts.map((attempt) => ({
      date: attempt.createdAt,
      score: attempt.score,
      status: attempt.status,
      language: attempt.language,
      challenge: attempt.challenge?.title || 'Coding Challenge',
      runtimeMs: attempt.runtimeMs || 0,
      complexity: attempt.complexity || 'n/a',
    }));

    const codingLeaderboard = codingAttempts
      .slice()
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 10)
      .map((attempt) => ({
        id: String(attempt._id),
        user: String(attempt.user),
        challenge: attempt.challenge?.title || 'Coding Challenge',
        score: attempt.score || 0,
        runtimeMs: attempt.runtimeMs || 0,
        language: attempt.language,
      }));

    const weakAreas = calculateWeakAreas(quizAttempts).slice(0, 5);
    const accuracy = quizAttempts.length
      ? Math.round(
          quizAttempts.reduce((sum, attempt) => sum + ((attempt.correctCount || 0) / Math.max(attempt.totalQuestions || 1, 1)), 0) /
            quizAttempts.length * 100
        )
      : 0;

    return {
      quizAttempts,
      quizScores,
      moduleBreakdown,
      codingHistory,
      codingLeaderboard,
      weakAreas,
      summary: {
        totalQuizAttempts: quizAttempts.length,
        totalCodingAttempts: codingAttempts.length,
        averageAccuracy: accuracy,
        bestQuizScore: quizAttempts.length ? Math.max(...quizAttempts.map((attempt) => attempt.score || 0)) : 0,
        bestCodingScore: codingAttempts.length ? Math.max(...codingAttempts.map((attempt) => attempt.score || 0)) : 0,
      },
    };
  } catch (error) {
    return buildEmptyAnalytics(userId);
  }
}

module.exports = {
  getUserAnalytics,
  calculateWeakAreas,
};
