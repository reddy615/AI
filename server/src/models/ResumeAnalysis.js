const mongoose = require('mongoose');

const ResumeAnalysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  originalFile: { type: String },
  parsedText: { type: String },
  analysis: { type: Object },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ResumeAnalysis', ResumeAnalysisSchema);
