const asyncHandler = require('../utils/asyncHandler');
const { sendError } = require('../utils/apiResponse');
const CodingChallenge = require('../models/CodingChallenge');
const CodingAttempt = require('../models/CodingAttempt');
const { submitToJudge0, getLanguageConfig } = require('../services/judge0Service');
const { recordActivity } = require('../services/gamificationService');

function normalizeOutput(value) {
  return String(value || '').replace(/\r\n/g, '\n').trim();
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

  const challenges = await CodingChallenge.find(query).sort({ createdAt: -1 }).limit(Math.min(Number(limit) || 20, 50)).lean();
  return res.apiSuccess({ challenges }, 'Coding challenges loaded');
});

exports.getChallenge = asyncHandler(async (req, res) => {
  const challenge = await CodingChallenge.findById(req.params.id).lean();
  if (!challenge) return sendError(res, 'Challenge not found', 404);
  return res.apiSuccess({ challenge }, 'Challenge loaded');
});

exports.runSubmission = asyncHandler(async (req, res) => {
  const { challengeId, language, sourceCode } = req.body;
  const challenge = await CodingChallenge.findById(challengeId).lean();
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

  const attempt = await CodingAttempt.create({
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

  const gamification = await recordActivity({
    userId: req.user.id,
    source: 'coding',
    score,
    accuracy: score,
    module: challenge.language,
    durationSeconds: Number(execution.time || 0),
  });

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
