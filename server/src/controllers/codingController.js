const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const { sendError } = require('../utils/apiResponse');
const CodingChallenge = require('../models/CodingChallenge');
const CodingAttempt = require('../models/CodingAttempt');
const { submitToJudge0, getLanguageConfig } = require('../services/judge0Service');
const { recordActivity } = require('../services/gamificationService');
const {
  getLocalCodingChallengeById,
  getLocalCodingChallenges,
  addLocalCodingAttempt,
  getLocalCodingLeaderboard,
} = require('../config/localCodingStore');

function normalizeOutput(value) {
  return String(value || '').replace(/\r\n/g, '\n').trim();
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function hasMongoConnection() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

function toPlainChallenge(challenge) {
  if (!challenge) return null
  return {
    ...challenge,
    _id: String(challenge._id),
  }
}

function createLocalAttempt({ req, challenge, language, sourceCode, execution, score, passedCount }) {
  const attempt = {
    _id: `local-attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user: String(req.user?.id || 'local-user'),
    challenge: String(challenge._id),
    language,
    sourceCode,
    status: execution.status,
    score,
    runtimeMs: execution.time || 0,
    memoryKb: execution.memory || 0,
    complexity: challenge.expectedComplexity || 'unknown',
    languageLabel: getLanguageConfig(language)?.label || language,
    resultSummary: `${passedCount}/${challenge.testCases.length} tests passed`,
    testResults: execution.testResults || [],
    judge0: {
      token: execution.token || null,
      submissionUrl: execution.url || null,
    },
    createdAt: new Date().toISOString(),
  }

  addLocalCodingAttempt(attempt)
  return attempt
}

function evaluateLocally({ language, sourceCode, testCases }) {
  const languageKey = String(language || '').toLowerCase();
  const command = languageKey === 'python' ? 'python' : languageKey === 'javascript' ? 'node' : null;

  if (!command) {
    return {
      status: 'failed',
      stdout: '',
      stderr: 'Local fallback runner only supports JavaScript and Python.',
      compileOutput: '',
      time: 0,
      memory: 0,
      testResults: [],
    };
  }

  const { spawnSync } = require('child_process');
  const tempArgs = languageKey === 'javascript' ? ['-e', sourceCode] : ['-c', sourceCode];
  const results = [];
  let passedCount = 0;
  let totalRuntime = 0;
  let stderrOutput = '';

  for (const testCase of testCases) {
    const startedAt = Date.now();
    const execution = spawnSync(command, tempArgs, {
      input: testCase.input,
      encoding: 'utf8',
      timeout: 5000,
      maxBuffer: 1024 * 1024,
    });
    totalRuntime += Date.now() - startedAt;

    const actualOutput = normalizeOutput(execution.stdout);
    const expectedOutput = normalizeOutput(testCase.expectedOutput);
    const passed = !execution.error && actualOutput === expectedOutput;

    if (execution.stderr) stderrOutput = `${stderrOutput}\n${execution.stderr}`.trim();
    if (passed) passedCount += 1;

    results.push({
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput,
      passed,
    });
  }

  const allPassed = passedCount === testCases.length;
  return {
    status: allPassed ? 'accepted' : 'wrong-answer',
    stdout: results.map((result) => result.actualOutput).join('\n'),
    stderr: stderrOutput,
    compileOutput: '',
    time: totalRuntime,
    memory: 0,
    testResults: results,
  };
}

exports.listChallenges = asyncHandler(async (req, res) => {
  const { language, difficulty, tag, limit = 20 } = req.query;
  const query = { isActive: true };
  if (language) query.language = language;
  if (difficulty) query.difficulty = difficulty;
  if (tag) query.tags = tag;

  console.log('[coding] GET /challenges', { query: req.query });

  if (hasMongoConnection()) {
    try {
      const challenges = await CodingChallenge.find(query).sort({ createdAt: -1 }).limit(Math.min(Number(limit) || 20, 50)).lean();
      if (challenges.length) {
        console.log('[coding] GET /challenges database result', { count: challenges.length, first: challenges[0]?._id });
        return res.apiSuccess({ challenges }, 'Coding challenges loaded');
      }
    } catch (error) {
      console.warn('[coding] GET /challenges falling back to local store', error.message);
    }
  } else {
    console.log('[coding] GET /challenges skipping MongoDB query because connection is unavailable');
  }

  const localChallenges = getLocalCodingChallenges({ language, difficulty, tag, limit }).map(toPlainChallenge);
  console.log('[coding] GET /challenges local fallback result', { count: localChallenges.length, first: localChallenges[0]?._id });
  return res.apiSuccess({ challenges: localChallenges }, 'Coding challenges loaded');
});

exports.getChallenge = asyncHandler(async (req, res) => {
  console.log('[coding] GET /challenges/:id', { id: req.params.id });

  if (hasMongoConnection()) {
    try {
      const challenge = await CodingChallenge.findById(req.params.id).lean();
      if (challenge) {
        console.log('[coding] GET /challenges/:id database hit', { id: challenge._id, title: challenge.title });
        return res.apiSuccess({ challenge }, 'Challenge loaded');
      }
    } catch (error) {
      console.warn('[coding] GET /challenges/:id falling back to local store', error.message);
    }
  } else {
    console.log('[coding] GET /challenges/:id skipping MongoDB query because connection is unavailable');
  }

  const localChallenge = toPlainChallenge(getLocalCodingChallengeById(req.params.id));
  if (!localChallenge) return sendError(res, 'Challenge not found', 404);
  console.log('[coding] GET /challenges/:id local fallback hit', { id: localChallenge._id, title: localChallenge.title });
  return res.apiSuccess({ challenge: localChallenge }, 'Challenge loaded');
});

exports.runSubmission = asyncHandler(async (req, res) => {
  const { challengeId, language } = req.body;
  const sourceCode = decodeHtmlEntities(req.body.sourceCode);

  console.log('[coding] POST /run', { challengeId, language, sourceLength: String(sourceCode || '').length });

  let challenge = null;
  if (hasMongoConnection()) {
    try {
      challenge = await CodingChallenge.findById(challengeId).lean();
      if (challenge) {
        console.log('[coding] POST /run database challenge hit', { id: challenge._id, title: challenge.title });
      }
    } catch (error) {
      console.warn('[coding] POST /run falling back to local challenge store', error.message);
    }
  } else {
    console.log('[coding] POST /run skipping MongoDB challenge lookup because connection is unavailable');
  }

  if (!challenge) {
    challenge = getLocalCodingChallengeById(challengeId);
  }

  if (!challenge) return sendError(res, 'Challenge not found', 404);

  const languageConfig = getLanguageConfig(language);
  if (!languageConfig) {
    return sendError(res, 'Unsupported language', 400);
  }

  const judge0Url = process.env.JUDGE0_API_URL || '';
  const judge0Key = process.env.JUDGE0_API_KEY || '';

  const execution = judge0Url
    ? await submitToJudge0({
        language,
        sourceCode,
        stdin: challenge.sampleInput,
        expectedOutput: challenge.sampleOutput,
        apiUrl: judge0Url,
        apiKey: judge0Key,
      })
    : evaluateLocally({
        language,
        sourceCode,
        testCases: challenge.testCases,
      });

  const passedCount = (execution.testResults || []).filter((testResult) => testResult.passed).length;
  const score = challenge.testCases.length ? Math.round((passedCount / challenge.testCases.length) * 100) : 0;
  const status = execution.status;

  let attempt = null;
  if (hasMongoConnection()) {
    try {
      attempt = await CodingAttempt.create({
        user: req.user.id,
        challenge: challenge._id,
        language,
        sourceCode,
        status,
        score,
        runtimeMs: execution.time || 0,
        memoryKb: execution.memory || 0,
        complexity: challenge.expectedComplexity || 'unknown',
        languageLabel: languageConfig.label,
        resultSummary: `${passedCount}/${challenge.testCases.length} tests passed`,
        testResults: execution.testResults || [],
        judge0: {
          token: execution.token || null,
          submissionUrl: execution.url || null,
        },
      });
    } catch (error) {
      console.warn('[coding] POST /run storing local attempt because MongoDB is unavailable', error.message);
      attempt = createLocalAttempt({ req, challenge, language, sourceCode, execution, score, passedCount });
    }
  } else {
    console.log('[coding] POST /run skipping MongoDB attempt write because connection is unavailable');
    attempt = createLocalAttempt({ req, challenge, language, sourceCode, execution, score, passedCount });
  }

  if (!attempt._id || String(attempt._id).startsWith('local-attempt-')) {
    console.log('[coding] POST /run local attempt stored', { attemptId: attempt._id, status: attempt.status, score: attempt.score });
  }

  let gamification = null;
  try {
    gamification = await recordActivity({
      userId: req.user.id,
      source: 'coding',
      score,
      accuracy: score,
      module: challenge.language,
      durationSeconds: Number(execution.time || 0),
    });
  } catch (error) {
    console.warn('[coding] gamification recording skipped', error.message);
  }

  return res.apiSuccess(
    {
      attempt,
      status,
      score,
      summary: `${passedCount}/${challenge.testCases.length} tests passed`,
      runtimeMs: execution.time || 0,
      testResults: execution.testResults || [],
      complexity: challenge.expectedComplexity || 'unknown',
      gamification,
    },
    'Submission evaluated',
  );
});

exports.getLeaderboard = asyncHandler(async (req, res) => {
  if (hasMongoConnection()) {
    try {
      const attempts = await CodingAttempt.find({})
        .populate('challenge', 'title language difficulty')
        .sort({ score: -1, runtimeMs: 1, createdAt: -1 })
        .limit(20)
        .lean();

      const leaderboard = attempts.map((attempt) => ({
        id: String(attempt._id),
        user: String(attempt.user),
        challenge: attempt.challenge?.title || 'Coding Challenge',
        language: attempt.language,
        bestScore: attempt.score || 0,
        bestRuntimeMs: attempt.runtimeMs || 0,
        submissions: 1,
      }));

      return res.apiSuccess({ leaderboard }, 'Leaderboard loaded');
    } catch (error) {
      console.warn('[coding] leaderboard falling back to local store', error.message);
    }
  } else {
    console.log('[coding] leaderboard skipping MongoDB query because connection is unavailable');
  }

  const localLeaderboard = getLocalCodingLeaderboard().map((attempt) => ({
    id: String(attempt._id),
    user: String(attempt.user),
    challenge: getLocalCodingChallengeById(attempt.challenge)?.title || 'Coding Challenge',
    language: attempt.language,
    bestScore: attempt.score || 0,
    bestRuntimeMs: attempt.runtimeMs || 0,
    submissions: 1,
  }));

  return res.apiSuccess({ leaderboard: localLeaderboard }, 'Leaderboard loaded');
});

exports.createChallenge = asyncHandler(async (req, res) => {
  const challenge = await CodingChallenge.create({
    title: req.body.title,
    prompt: req.body.prompt,
    starterCode: req.body.starterCode,
    language: req.body.language,
    difficulty: req.body.difficulty,
    tags: req.body.tags || [],
    timeLimitMinutes: req.body.timeLimitMinutes || 30,
    sampleInput: req.body.sampleInput || '',
    sampleOutput: req.body.sampleOutput || '',
    constraints: req.body.constraints || [],
    testCases: req.body.testCases || [],
    expectedComplexity: req.body.expectedComplexity || '',
    isActive: req.body.isActive !== false,
    createdBy: req.user.id,
  });

  return res.apiSuccess({ challenge }, 'Challenge created', 201);
});
