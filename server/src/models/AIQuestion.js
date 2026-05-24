const mongoose = require('mongoose');

const aiQuestionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  module: { type: String, enum: ['aptitude', 'reasoning', 'verbal', 'hr', 'technical'], required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  prompt: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String },
  explanation: { type: String },
  tags: [{ type: String }],
  source: { type: String, enum: ['openai', 'gemini', 'fallback'], default: 'fallback' },
  candidateProfile: {
    role: { type: String },
    experienceLevel: { type: String },
    weakAreas: [{ type: String }],
  },
}, { timestamps: true });

module.exports = mongoose.model('AIQuestion', aiQuestionSchema);
