const localInterviewSessions = new Map();

function cloneSession(session) {
  if (!session) return null;
  const plain = typeof session.toObject === 'function'
    ? session.toObject()
    : JSON.parse(JSON.stringify(session));

  if (plain && plain._id && !plain.id) {
    plain.id = String(plain._id);
  }

  return plain;
}

function createLocalInterviewSession(payload) {
  const now = new Date();
  const session = {
    _id: `local-interview-${now.getTime()}-${Math.random().toString(16).slice(2)}`,
    ...payload,
    createdAt: now,
    updatedAt: now,
    save: async function save() {
      this.updatedAt = new Date();
      localInterviewSessions.set(String(this._id), this);
      return this;
    },
    toObject: function toObject() {
      const { save, toObject, ...rest } = this;
      return JSON.parse(JSON.stringify(rest));
    },
  };

  session.id = String(session._id);
  localInterviewSessions.set(String(session._id), session);
  return session;
}

function getLocalInterviewSessionById(sessionId) {
  return localInterviewSessions.get(String(sessionId)) || null;
}

function listLocalInterviewSessionsByUser(userId) {
  return [...localInterviewSessions.values()]
    .filter((session) => String(session.user) === String(userId))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 20)
    .map(cloneSession);
}

module.exports = {
  createLocalInterviewSession,
  getLocalInterviewSessionById,
  listLocalInterviewSessionsByUser,
  cloneSession,
};