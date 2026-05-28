const mongoose = require('mongoose');
const MockInterviewSession = require('../models/MockInterviewSession');
const {
  createLocalInterviewSession,
  getLocalInterviewSessionById,
  listLocalInterviewSessionsByUser,
  cloneSession,
} = require('../config/localInterviews');

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

async function createInterviewSession(payload) {
  if (isMongoReady()) {
    return MockInterviewSession.create(payload);
  }

  return createLocalInterviewSession(payload);
}

async function findInterviewSessionById(sessionId) {
  if (isMongoReady()) {
    return MockInterviewSession.findById(sessionId);
  }

  return getLocalInterviewSessionById(sessionId);
}

async function listInterviewSessionsByUser(userId) {
  if (isMongoReady()) {
    return MockInterviewSession.find({ user: userId }).sort({ createdAt: -1 }).limit(20).lean();
  }

  return listLocalInterviewSessionsByUser(userId);
}

function serializeInterviewSession(session) {
  return cloneSession(session);
}

module.exports = {
  createInterviewSession,
  findInterviewSessionById,
  listInterviewSessionsByUser,
  serializeInterviewSession,
  isMongoReady,
};