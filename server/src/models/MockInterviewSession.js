const mongoose = require('mongoose');

const mockQuestionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  question: { type: String, required: true },
  followUps: [{ type: String }],
  idealSignals: [{ type: String }],
  order: { type: Number, default: 0 },
}, { _id: false });

const transcriptSchema = new mongoose.Schema({
  role: { type: String, enum: ['interviewer', 'candidate', 'system'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  confidence: { type: Number, default: 0 },
}, { _id: false });

const cameraMetricSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  faceDetected: { type: Boolean, default: false },
  eyeContactScore: { type: Number, default: 0 },
  emotion: { type: String, default: 'neutral' },
  confidenceScore: { type: Number, default: 0 },
  attentionScore: { type: Number, default: 0 },
  speakingIntensity: { type: Number, default: 0 },
}, { _id: false });

const audioMetricSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  transcript: { type: String, default: '' },
  wordsPerMinute: { type: Number, default: 0 },
  confidence: { type: Number, default: 0 },
  sentiment: { type: String, default: 'neutral' },
  clarityScore: { type: Number, default: 0 },
}, { _id: false });

const feedbackSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  message: { type: String, required: true },
  scoreDelta: { type: Number, default: 0 },
  category: { type: String, default: 'general' },
}, { _id: false });

const mockInterviewSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  interviewType: { type: String, enum: ['hr', 'technical', 'behavioral'], required: true },
  role: { type: String, default: 'Software Engineer' },
  experienceLevel: { type: String, default: 'mid' },
  status: { type: String, enum: ['created', 'live', 'completed', 'abandoned'], default: 'created' },
  currentQuestionIndex: { type: Number, default: 0 },
  questions: [mockQuestionSchema],
  transcript: [transcriptSchema],
  cameraMetrics: [cameraMetricSchema],
  audioMetrics: [audioMetricSchema],
  feedback: [feedbackSchema],
  scores: {
    communicationScore: { type: Number, default: 0 },
    confidenceScore: { type: Number, default: 0 },
    technicalAccuracyScore: { type: Number, default: 0 },
    behavioralScore: { type: Number, default: 0 },
    eyeContactScore: { type: Number, default: 0 },
    overallScore: { type: Number, default: 0 },
  },
  metrics: {
    averageSpeechRate: { type: Number, default: 0 },
    averageEyeContact: { type: Number, default: 0 },
    averageConfidence: { type: Number, default: 0 },
    averageAttention: { type: Number, default: 0 },
  },
  summary: { type: String, default: '' },
  startedAt: { type: Date },
  endedAt: { type: Date },
  durationSeconds: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('MockInterviewSession', mockInterviewSessionSchema);
