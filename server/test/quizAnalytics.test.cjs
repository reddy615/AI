const assert = require('node:assert');
const { test } = require('node:test');
const mongoose = require('mongoose');
const Attempt = require('../src/models/Attempt');
const {
  aggregateTopicAnalytics,
  mergeQuestionMetadata,
  scoreQuizAnswers,
  toByTopic,
} = require('../src/services/quizAnalyticsService');

test('Attempt schema preserves topic-wise answer result fields', () => {
  const userId = new mongoose.Types.ObjectId();
  const attempt = new Attempt({
    user: userId,
    userId,
    module: 'aptitude',
    answers: [{
      questionId: 'question-1',
      questionText: 'Sample question',
      category: 'Arithmetic',
      topic: 'Percentages',
      selectedIndex: 1,
      selectedAnswer: '20',
      correctIndex: 1,
      correctAnswer: '20',
      isCorrect: true,
      isSkipped: false,
      marks: 2,
      negativeMarks: 0.25,
      score: 2,
    }],
  }).toObject();

  assert.equal(String(attempt.userId), String(userId));
  assert.equal(attempt.answers[0].topic, 'Percentages');
  assert.equal(attempt.answers[0].category, 'Arithmetic');
  assert.equal(attempt.answers[0].selectedAnswer, '20');
  assert.equal(attempt.answers[0].isCorrect, true);
  assert.equal(attempt.answers[0].score, 2);
});

test('scoreQuizAnswers records correct, wrong, and skipped answers with topics', () => {
  const questions = new Map([
    ['arrays', {
      _id: 'arrays',
      module: 'aptitude',
      category: 'Programming',
      topic: 'Arrays',
      text: 'Array question',
      options: [{ text: 'A' }, { text: 'B' }],
      correctIndex: 1,
      marks: 2,
      negativeMarks: 0.5,
    }],
    ['dbms', {
      _id: 'dbms',
      module: 'aptitude',
      category: 'Computer Science',
      topic: 'DBMS',
      text: 'DBMS question',
      options: [{ text: 'A' }, { text: 'B' }],
      correctIndex: 0,
      marks: 1,
      negativeMarks: 0.25,
    }],
    ['os', {
      _id: 'os',
      module: 'aptitude',
      category: 'Computer Science',
      topic: 'OS',
      text: 'OS question',
      options: [{ text: 'A' }, { text: 'B' }],
      correctIndex: 0,
      marks: 1,
      negativeMarks: 0.25,
    }],
  ]);

  const result = scoreQuizAnswers(questions, { arrays: 1, dbms: 1, os: null });

  assert.deepEqual(
    { score: result.score, correct: result.correct, wrong: result.wrong, skipped: result.skipped },
    { score: 1.75, correct: 1, wrong: 1, skipped: 1 }
  );
  assert.deepEqual(
    result.answerRecords.map((answer) => ({
      topic: answer.topic,
      isCorrect: answer.isCorrect,
      isSkipped: answer.isSkipped,
      score: answer.score,
    })),
    [
      { topic: 'Arrays', isCorrect: true, isSkipped: false, score: 2 },
      { topic: 'DBMS', isCorrect: false, isSkipped: false, score: -0.25 },
      { topic: 'OS', isCorrect: false, isSkipped: true, score: 0 },
    ]
  );
});

test('aggregateTopicAnalytics groups by topic and calculates accuracy and score', () => {
  const topicAnalytics = aggregateTopicAnalytics([{
    category: 'Fallback Category',
    answers: [
      { topic: 'Arrays', selectedIndex: 1, correctIndex: 1, isCorrect: true, marks: 2, score: 2 },
      { topic: 'Arrays', selectedIndex: 0, correctIndex: 1, isCorrect: false, negativeMarks: 0.5, score: -0.5 },
      { topic: 'Arrays', selectedIndex: null, correctIndex: 1, isSkipped: true, score: 0 },
      { topic: 'DBMS', selectedIndex: 0, correctIndex: 0, marks: 1 },
    ],
  }]);

  assert.deepEqual(topicAnalytics, [
    { topic: 'Arrays', total: 3, correct: 1, wrong: 1, skipped: 1, score: 1.5, accuracy: 33 },
    { topic: 'DBMS', total: 1, correct: 1, wrong: 0, skipped: 0, score: 1, accuracy: 100 },
  ]);
  assert.equal(toByTopic(topicAnalytics).Arrays.skipped, 1);
});

test('old answers recover question topic metadata before General fallback', () => {
  const attempts = [{
    answers: [{ questionId: 'legacy-question', selectedIndex: 0, correctIndex: 0, marks: 1 }],
  }];
  const hydrated = mergeQuestionMetadata(attempts, new Map([
    ['legacy-question', {
      topic: 'Strings',
      category: 'Programming',
      text: 'Legacy question',
      correctIndex: 0,
      marks: 1,
      negativeMarks: 0,
      options: [{ text: 'Correct' }],
    }],
  ]));

  assert.equal(aggregateTopicAnalytics(hydrated)[0].topic, 'Strings');
  assert.equal(aggregateTopicAnalytics([{ answers: [{ selectedIndex: null }] }])[0].topic, 'General');
});
