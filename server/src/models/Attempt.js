const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.Mixed },
  questionText: { type: String },
  module: { type: String },
  category: { type: String },
  topic: { type: String },
  selectedIndex: { type: Number, default: null },
  selectedAnswer: { type: String, default: null },
  correctIndex: { type: Number },
  correctAnswer: { type: String, default: null },
  isCorrect: { type: Boolean },
  isSkipped: { type: Boolean },
  marks: { type: Number, default: 0 },
  negativeMarks: { type: Number, default: 0 },
  score: { type: Number }
}, { _id: false });

const attemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
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
