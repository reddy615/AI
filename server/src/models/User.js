const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  resume: { type: String },
  resumeUrl: { type: String },
  resumeMimeType: { type: String },
  resumeFileName: { type: String },
  resumePublicId: { type: String },
  resumeResourceType: { type: String, default: 'raw' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  preferredLanguage: { type: String, default: 'en' },
  isActive: { type: Boolean, default: true },
  assessmentAccess: {
    technical: { type: Boolean, default: false },
    aptitude: { type: Boolean, default: false },
    coding: { type: Boolean, default: false },
    mockInterview: { type: Boolean, default: false },
  },
  refreshTokenVersion: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
