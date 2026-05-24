const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  key: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  earnedAt: { type: Date, default: Date.now },
}, { _id: false });

const activitySchema = new mongoose.Schema({
  type: { type: String, required: true },
  source: { type: String, required: true },
  xp: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  module: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const userProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  dailyXp: { type: Number, default: 0 },
  lastActivityAt: { type: Date },
  badges: { type: [badgeSchema], default: [] },
  achievements: { type: [badgeSchema], default: [] },
  recentActivities: { type: [activitySchema], default: [] },
  totalQuizzes: { type: Number, default: 0 },
  totalCodingAttempts: { type: Number, default: 0 },
  totalInterviews: { type: Number, default: 0 },
  totalAiGenerations: { type: Number, default: 0 },
  preferredLanguage: { type: String, default: 'en' },
}, { timestamps: true });

module.exports = mongoose.model('UserProgress', userProgressSchema);