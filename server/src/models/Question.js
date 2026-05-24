const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({ text: String }, { _id: false });

const questionSchema = new mongoose.Schema({
  module: { type: String, required: true }, // aptitude|reasoning|verbal
  category: { type: String },
  topic: { type: String },
  difficulty: { type: String, enum: ['easy','medium','hard'], default: 'medium' },
  text: { type: String, required: true },
  options: [optionSchema],
  correctIndex: { type: Number, required: true },
  explanation: { type: String },
  marks: { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0 },
  source: { type: String, enum: ['seed', 'openai', 'gemini', 'fallback'], default: 'seed' },
  isAiGenerated: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
