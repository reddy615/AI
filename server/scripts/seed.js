#!/usr/bin/env node
/**
 * Seed script for quiz questions.
 * Usage: node scripts/seed.js [--force]
 */
const dotenv = require('dotenv')
dotenv.config()
const connectDB = require('../src/config/db')
const Question = require('../src/models/Question')
const CodingChallenge = require('../src/models/CodingChallenge')
const { generateAll } = require('../src/seed/questions')
const { generateCodingChallenges } = require('../src/seed/codingChallenges')

async function run(){
  await connectDB()
  const force = process.argv.includes('--force')
  const count = await Question.countDocuments()
  const codingCount = await CodingChallenge.countDocuments()

  if (count > 0 && codingCount > 0 && !force){
    console.log(`Database already has ${count} questions and ${codingCount} coding challenges. Use --force to reseed.`)
    process.exit(0)
  }

  if (force){
    console.log('Force mode: clearing existing questions and coding challenges...')
    await Question.deleteMany({})
    await CodingChallenge.deleteMany({})
  }

  if (count === 0 || force){
    const questions = generateAll(40) // 40 per module -> 120 total
    console.log(`Inserting ${questions.length} questions...`)
    await Question.insertMany(questions)
  }

  if (codingCount === 0 || force){
    const challenges = generateCodingChallenges()
    console.log(`Inserting ${challenges.length} coding challenges...`)
    await CodingChallenge.insertMany(challenges)
  }

  console.log('Seeding complete.')
  process.exit(0)
}

run().catch(err=>{ console.error(err); process.exit(1) })
