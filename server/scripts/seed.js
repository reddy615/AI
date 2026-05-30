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
const User = require('../src/models/User')
const bcrypt = require('bcryptjs')
const { LOCAL_USERS } = require('../src/config/localUsers')
const { generateAll } = require('../src/seed/questions')
const { generateCodingChallenges } = require('../src/seed/codingChallenges')

function isBcryptHash(value){
  return typeof value === 'string' && /^\$2[aby]?\$\d{2}\$/.test(value)
}

async function seedUsers(force){
  for (const defaultUser of LOCAL_USERS){
    const hash = isBcryptHash(defaultUser.password)
      ? defaultUser.password
      : await bcrypt.hash(defaultUser.password, 10)
    await User.updateOne(
      { email: defaultUser.email },
      {
        $set: {
          name: defaultUser.name,
          email: defaultUser.email,
          password: hash,
          role: defaultUser.role || 'user',
          isActive: true,
        },
        $setOnInsert: {
          preferredLanguage: 'en',
          refreshTokenVersion: 0,
        },
      },
      { upsert: true }
    )
    console.log(`Ensured login account exists for ${defaultUser.email}${force ? ' (force mode)' : ''}`)
  }
}

async function run(){
  await connectDB()
  const force = process.argv.includes('--force')
  await seedUsers(force)
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
