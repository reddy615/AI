const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
}, { _id: false });

const codingChallengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  prompt: { type: String, required: true },
  starterCode: { type: String, required: true },
  language: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  tags: [{ type: String }],
  timeLimitMinutes: { type: Number, default: 30 },
  sampleInput: { type: String },
  sampleOutput: { type: String },
  constraints: [{ type: String }],
  testCases: [testCaseSchema],
  expectedComplexity: { type: String },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('CodingChallenge', codingChallengeSchema);
