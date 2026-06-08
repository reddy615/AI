const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.Mixed },
  selectedIndex: { type: Number },
  correctIndex: { type: Number },
  marks: { type: Number },
  negativeMarks: { type: Number }
}, { _id: false });

const attemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  module: { type: String },
  difficulty: { type: String },
  category: { type: String },
  totalQuestions: { type: Number },
  answers: [answerSchema],
  score: { type: Number },
  correctCount: { type: Number },
  wrongCount: { type: Number },
  skippedCount: { type: Number },
  durationSeconds: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Attempt', attemptSchema);
