const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  input: { type: String },
  expectedOutput: { type: String },
  actualOutput: { type: String },
  passed: { type: Boolean, default: false },
}, { _id: false });

const codingAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingChallenge', required: true },
  language: { type: String, required: true },
  sourceCode: { type: String, required: true },
  status: { type: String, enum: ['queued', 'running', 'accepted', 'wrong-answer', 'runtime-error', 'time-limit', 'compile-error', 'failed'], default: 'queued' },
  score: { type: Number, default: 0 },
  runtimeMs: { type: Number, default: 0 },
  memoryKb: { type: Number, default: 0 },
  complexity: { type: String },
  languageLabel: { type: String },
  resultSummary: { type: String },
  testResults: [testResultSchema],
  judge0: {
    token: { type: String },
    submissionUrl: { type: String },
  },
}, { timestamps: true });

module.exports = mongoose.model('CodingAttempt', codingAttemptSchema);
