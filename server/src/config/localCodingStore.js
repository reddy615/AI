const { generateCodingChallenges } = require('../seed/codingChallenges')

const localCodingChallenges = generateCodingChallenges().map((challenge, index) => ({
  ...challenge,
  _id: `local-coding-${index + 1}`,
}))

const localCodingAttempts = []

function getLocalCodingChallengeById(id) {
  return localCodingChallenges.find((challenge) => challenge._id === id) || null
}

function getLocalCodingChallenges({ language, difficulty, tag, limit = 20 } = {}) {
  let challenges = [...localCodingChallenges]

  if (language) {
    challenges = challenges.filter((challenge) => String(challenge.language).toLowerCase() === String(language).toLowerCase())
  }

  if (difficulty) {
    challenges = challenges.filter((challenge) => String(challenge.difficulty).toLowerCase() === String(difficulty).toLowerCase())
  }

  if (tag) {
    challenges = challenges.filter((challenge) => (challenge.tags || []).includes(tag))
  }

  return challenges.slice(0, Math.min(Number(limit) || 20, 50))
}

function addLocalCodingAttempt(attempt) {
  localCodingAttempts.unshift(attempt)
  return attempt
}

function getLocalCodingLeaderboard() {
  return localCodingAttempts
    .slice()
    .sort((a, b) => (b.score - a.score) || (a.runtimeMs - b.runtimeMs) || (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    .slice(0, 20)
}

module.exports = {
  localCodingChallenges,
  localCodingAttempts,
  getLocalCodingChallengeById,
  getLocalCodingChallenges,
  addLocalCodingAttempt,
  getLocalCodingLeaderboard,
}