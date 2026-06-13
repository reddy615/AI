const mongoose = require('mongoose');
const Attempt = require('../models/Attempt');
const CodingAttempt = require('../models/CodingAttempt');
const { localQuizAttemptStore } = require('../config/localQuizStore');
const {
  aggregateTopicAnalytics,
  hydrateAttemptQuestionMetadata,
} = require('./quizAnalyticsService');

function calculateWeakAreas(attempts) {
  return aggregateTopicAnalytics(attempts)
    .sort((left, right) => left.accuracy - right.accuracy || left.topic.localeCompare(right.topic));
}

async function getUserAnalytics(userId) {
  let storedQuizAttempts = [];
  let codingAttempts = [];

  if (mongoose.connection.readyState === 1) {
    [storedQuizAttempts, codingAttempts] = await Promise.all([
      Attempt.find({ $or: [{ user: userId }, { userId }] }).sort({ createdAt: 1 }).lean(),
      CodingAttempt.find({ user: userId }).populate('challenge').sort({ createdAt: -1 }).lean(),
    ]);
  }

  const localQuizAttempts = Array.from(localQuizAttemptStore.values())
    .filter((attempt) => String(attempt.user || attempt.userId) === String(userId));
  const quizAttempts = await hydrateAttemptQuestionMetadata([...storedQuizAttempts, ...localQuizAttempts]);
  quizAttempts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const quizScores = quizAttempts.map((attempt) => ({
    date: attempt.createdAt,
    score: attempt.score,
    module: attempt.module,
    correct: attempt.correctCount || 0,
    wrong: attempt.wrongCount || 0,
    skipped: attempt.skippedCount || 0,
  }));

  const moduleBreakdown = quizAttempts.reduce((accumulator, attempt) => {
    const current = accumulator[attempt.module] || { attempts: 0, score: 0, correct: 0, wrong: 0, skipped: 0 };
    current.attempts += 1;
    current.score += attempt.score || 0;
    current.correct += attempt.correctCount || 0;
    current.wrong += attempt.wrongCount || 0;
    current.skipped += attempt.skippedCount || 0;
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

  const topicAnalytics = aggregateTopicAnalytics(quizAttempts);
  const weakAreas = [...topicAnalytics]
    .sort((left, right) => left.accuracy - right.accuracy || left.topic.localeCompare(right.topic))
    .slice(0, 5);
  const totalCorrect = quizAttempts.reduce((sum, attempt) => sum + (attempt.correctCount || 0), 0);
  const totalQuestions = quizAttempts.reduce((sum, attempt) => (
    sum + Math.max(
      attempt.totalQuestions || 0,
      (attempt.correctCount || 0) + (attempt.wrongCount || 0) + (attempt.skippedCount || 0)
    )
  ), 0);
  const accuracy = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return {
    quizAttempts,
    quizScores,
    moduleBreakdown,
    topicAnalytics,
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
}

module.exports = {
  getUserAnalytics,
  calculateWeakAreas,
};
