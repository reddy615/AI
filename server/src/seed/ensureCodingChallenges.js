const CodingChallenge = require('../models/CodingChallenge')
const { generateCodingChallenges } = require('./codingChallenges')

async function ensureCodingChallengesSeeded({ force = false } = {}) {
  const count = await CodingChallenge.countDocuments({})
  if (count > 0 && !force) {
    return { seeded: false, count }
  }

  if (force) {
    await CodingChallenge.deleteMany({})
  }

  const challenges = generateCodingChallenges()
  await CodingChallenge.insertMany(challenges)
  return { seeded: true, count: challenges.length }
}

module.exports = { ensureCodingChallengesSeeded }
