const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  accessKey: {
    type: String,
    required: true,
    enum: ['technical', 'aptitude', 'coding', 'mockInterview'],
  },
  module: {
    type: String,
    enum: ['aptitude', 'reasoning', 'verbal'],
    default: null,
  },
  category: { type: String, default: '' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  count: { type: Number, default: 10 },
  duration: { type: Number, default: 30 },
  passingScore: { type: Number, default: 60 },
  topics: { type: [String], default: [] },
  questions: {
    type: [new mongoose.Schema({
      text: { type: String, default: '' },
      options: { type: [String], default: [] },
      correctAnswer: { type: Number, default: 0 },
      topic: { type: String, default: '' },
      marks: { type: Number, default: 1 },
      explanation: { type: String, default: '' },
    }, { _id: false })],
    default: [],
  },
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
