const mongoose = require('mongoose');
const Question = require('../models/Question');

function asNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizeLabel(value) {
  const label = String(value || '').trim();
  return label || null;
}

function isFallbackTopic(value) {
  const topic = normalizeLabel(value);
  return !topic || topic.toLowerCase() === 'general';
}

function getQuestionId(answer) {
  const questionId = answer?.questionId?._id || answer?.questionId;
  return questionId ? String(questionId) : null;
}

function resolveTopic(answer, attempt = {}) {
  const storedTopic = normalizeLabel(answer?.topic);
  return (!isFallbackTopic(storedTopic) ? storedTopic : null)
    || normalizeLabel(answer?.questionId?.topic)
    || normalizeLabel(answer?.category)
    || normalizeLabel(answer?.questionId?.category)
    || normalizeLabel(attempt.category)
    || storedTopic
    || 'General';
}

function isSkippedAnswer(answer) {
  return answer?.isSkipped === true
    || answer?.selectedIndex === null
    || answer?.selectedIndex === undefined;
}

function isCorrectAnswer(answer) {
  if (isSkippedAnswer(answer)) return false;
  if (typeof answer?.isCorrect === 'boolean') return answer.isCorrect;
  return Number(answer?.selectedIndex) === Number(answer?.correctIndex);
}

function getAnswerScore(answer) {
  if (answer?.score !== null && answer?.score !== undefined && Number.isFinite(Number(answer.score))) {
    return Number(answer.score);
  }
  if (isSkippedAnswer(answer)) return 0;
  return isCorrectAnswer(answer)
    ? asNumber(answer?.marks)
    : -asNumber(answer?.negativeMarks);
}

function roundScore(value) {
  return Math.round((asNumber(value) + Number.EPSILON) * 100) / 100;
}

function aggregateTopicAnalytics(attempts = []) {
  const grouped = new Map();

  for (const attempt of attempts) {
    for (const answer of attempt?.answers || []) {
      const topic = resolveTopic(answer, attempt);
      const current = grouped.get(topic) || {
        topic,
        total: 0,
        correct: 0,
        wrong: 0,
        skipped: 0,
        score: 0,
      };

      current.total += 1;
      current.score += getAnswerScore(answer);

      if (isSkippedAnswer(answer)) {
        current.skipped += 1;
      } else if (isCorrectAnswer(answer)) {
        current.correct += 1;
      } else {
        current.wrong += 1;
      }

      grouped.set(topic, current);
    }
  }

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      score: roundScore(item.score),
      accuracy: item.total ? Math.round((item.correct / item.total) * 100) : 0,
    }))
    .sort((left, right) => left.topic.localeCompare(right.topic));
}

function toByTopic(topicAnalytics = []) {
  return Object.fromEntries(topicAnalytics.map((item) => [
    item.topic,
    {
      total: item.total,
      correct: item.correct,
      wrong: item.wrong,
      skipped: item.skipped,
      score: item.score,
      accuracy: item.accuracy,
    },
  ]));
}

function mergeQuestionMetadata(attempts = [], questionsById = new Map()) {
  return attempts.map((attempt) => ({
    ...attempt,
    answers: (attempt.answers || []).map((answer) => {
      const question = questionsById.get(getQuestionId(answer));
      if (!question) return answer;

      return {
        ...answer,
        questionId: answer.questionId,
        questionText: answer.questionText || question.text,
        module: answer.module || question.module,
        category: answer.category || question.category,
        topic: isFallbackTopic(answer.topic) ? question.topic || answer.topic : answer.topic,
        correctIndex: answer.correctIndex ?? question.correctIndex,
        correctAnswer: answer.correctAnswer || question.options?.[question.correctIndex]?.text || null,
        marks: answer.marks ?? question.marks,
        negativeMarks: answer.negativeMarks ?? question.negativeMarks,
      };
    }),
  }));
}

async function hydrateAttemptQuestionMetadata(attempts = []) {
  const questionIds = Array.from(new Set(
    attempts
      .flatMap((attempt) => attempt?.answers || [])
      .filter((answer) => isFallbackTopic(answer.topic) || !normalizeLabel(answer.category))
      .map(getQuestionId)
      .filter((id) => id && mongoose.isValidObjectId(id))
  ));

  if (!questionIds.length || mongoose.connection.readyState !== 1) {
    return attempts;
  }

  const questions = await Question.find({
    _id: { $in: questionIds.map((id) => new mongoose.Types.ObjectId(id)) },
  })
    .select('module category topic text options correctIndex marks negativeMarks')
    .lean();

  const questionsById = new Map(questions.map((question) => [String(question._id), question]));
  return mergeQuestionMetadata(attempts, questionsById);
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

    const selectedIndex = selectedValue === null || selectedValue === undefined
      ? null
      : Number(selectedValue);
    const isSkipped = selectedIndex === null;
    const isCorrect = !isSkipped && selectedIndex === Number(question.correctIndex);
    const answerScore = isSkipped
      ? 0
      : isCorrect
        ? asNumber(question.marks)
        : -asNumber(question.negativeMarks);

    if (isSkipped) {
      skipped += 1;
    } else if (isCorrect) {
      correct += 1;
    } else {
      wrong += 1;
    }

    score += answerScore;
    answerRecords.push({
      questionId: question._id,
      questionText: question.text,
      module: question.module,
      category: question.category,
      topic: question.topic || question.category || 'General',
      selectedIndex,
      selectedAnswer: isSkipped ? null : question.options?.[selectedIndex]?.text || null,
      correctIndex: question.correctIndex,
      correctAnswer: question.options?.[question.correctIndex]?.text || null,
      isCorrect,
      isSkipped,
      marks: asNumber(question.marks),
      negativeMarks: asNumber(question.negativeMarks),
      score: roundScore(answerScore),
    });
  }

  return {
    score: roundScore(score),
    correct,
    wrong,
    skipped,
    answerRecords,
  };
}

module.exports = {
  aggregateTopicAnalytics,
  getAnswerScore,
  hydrateAttemptQuestionMetadata,
  isCorrectAnswer,
  isSkippedAnswer,
  mergeQuestionMetadata,
  resolveTopic,
  scoreQuizAnswers,
  toByTopic,
};
