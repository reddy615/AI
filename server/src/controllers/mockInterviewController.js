const asyncHandler = require('../utils/asyncHandler');
const { sendError } = require('../utils/apiResponse');
const MockInterviewSession = require('../models/MockInterviewSession');
const {
  createSession,
  evaluateTranscript,
  buildFollowUpQuestions,
  appendSessionFeedback,
  calculateSessionAverages,
} = require('../services/mockInterviewService');
const { transcribeAudio, estimateSpeechMetrics } = require('../services/speechService');
const { analyzeCameraFrame, summarizeCameraMetrics } = require('../services/cameraService');
const { recordActivity } = require('../services/gamificationService');

exports.startSession = asyncHandler(async (req, res) => {
  const { interviewType = 'technical', role = 'Software Engineer', experienceLevel = 'mid', weakAreas = [] } = req.body;
  const session = await createSession({
    userId: req.user.id,
    interviewType,
    role,
    experienceLevel,
    weakAreas,
  });

  return res.apiSuccess({ session }, 'Mock interview session created', 201);
});

exports.getSession = asyncHandler(async (req, res) => {
  const session = await MockInterviewSession.findById(req.params.id).lean();
  if (!session) return sendError(res, 'Session not found', 404);
  if (String(session.user) !== String(req.user.id)) return sendError(res, 'Forbidden', 403);
  return res.apiSuccess({ session }, 'Session loaded');
});

exports.endSession = asyncHandler(async (req, res) => {
  const session = await MockInterviewSession.findById(req.params.id);
  if (!session) return sendError(res, 'Session not found', 404);
  if (String(session.user) !== String(req.user.id)) return sendError(res, 'Forbidden', 403);

  const cameraSummary = summarizeCameraMetrics(session.cameraMetrics || []);
  const speechSummary = (session.audioMetrics || []).length
    ? session.audioMetrics.reduce((sum, item) => sum + (item.wordsPerMinute || 0), 0) / session.audioMetrics.length
    : 0;

  session.metrics = {
    ...session.metrics,
    averageEyeContact: cameraSummary.averageEyeContact,
    averageConfidence: cameraSummary.averageConfidence,
    averageAttention: cameraSummary.averageAttention,
    averageSpeechRate: Math.round(speechSummary),
  };

  session.scores.overallScore = Math.round(
    (session.scores.communicationScore + session.scores.confidenceScore + session.scores.technicalAccuracyScore + session.scores.behavioralScore + session.scores.eyeContactScore) / 5,
  );
  session.status = 'completed';
  session.endedAt = new Date();
  session.durationSeconds = session.startedAt ? Math.max(1, Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 1000)) : 0;
  session.summary = session.feedback?.length ? session.feedback[0].message : 'Interview completed.';

  const gamification = await recordActivity({
    userId: req.user.id,
    source: 'interview',
    score: session.scores.overallScore,
    accuracy: session.scores.overallScore,
    module: session.interviewType,
    durationSeconds: session.durationSeconds,
  });

  await session.save();
  return res.apiSuccess({ session, gamification }, 'Session completed');
});

exports.transcribeAudio = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const session = await MockInterviewSession.findById(sessionId);
  if (!session) return sendError(res, 'Session not found', 404);
  if (String(session.user) !== String(req.user.id)) return sendError(res, 'Forbidden', 403);

  const audioBuffer = req.file?.buffer || Buffer.alloc(0);
  const transcript = await transcribeAudio({ audioBuffer, mimeType: req.file?.mimetype || 'audio/webm' });
  const durationMs = Number(req.body.durationMs || 0);
  const speechMetrics = estimateSpeechMetrics(transcript, durationMs);

  const payload = {
    role: 'candidate',
    text: transcript || req.body.transcript || '',
    timestamp: new Date(),
    confidence: speechMetrics.confidence,
  };

  session.transcript.push(payload);
  session.audioMetrics.push({
    timestamp: new Date(),
    transcript: payload.text,
    wordsPerMinute: speechMetrics.wordsPerMinute,
    confidence: speechMetrics.confidence,
    sentiment: speechMetrics.sentiment,
    clarityScore: speechMetrics.clarityScore,
  });
  session.scores.communicationScore = Math.round((session.scores.communicationScore + speechMetrics.clarityScore + speechMetrics.confidence) / 3);
  session.scores.confidenceScore = Math.round((session.scores.confidenceScore + speechMetrics.confidence) / 2);
  session.metrics.averageSpeechRate = Math.round((session.metrics.averageSpeechRate + speechMetrics.wordsPerMinute) / 2);
  await session.save();

  return res.apiSuccess({ transcript: payload.text, speechMetrics }, 'Audio analyzed');
});

exports.processTranscript = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { transcript = '', questionId, cameraMetrics = [] } = req.body;
  let session = await MockInterviewSession.findById(sessionId);
  if (!session) return sendError(res, 'Session not found', 404);
  if (String(session.user) !== String(req.user.id)) return sendError(res, 'Forbidden', 403);

  const question = session.questions.find((item) => String(item.id) === String(questionId)) || session.questions[session.currentQuestionIndex] || session.questions[0];
  const evaluation = evaluateTranscript({
    transcript,
    interviewType: session.interviewType,
    question,
    cameraMetrics,
    audioMetrics: session.audioMetrics || [],
  });

  session.transcript.push({ role: 'candidate', text: transcript, timestamp: new Date(), confidence: evaluation.confidenceScore });
  session = appendSessionFeedback(session, evaluation);
  session.currentQuestionIndex = Math.min(session.currentQuestionIndex + 1, Math.max(session.questions.length - 1, 0));
  await session.save();

  return res.apiSuccess(
    {
      evaluation,
      followUps: buildFollowUpQuestions({ interviewType: session.interviewType, responseText: transcript, question }),
      session,
    },
    'Transcript processed',
  );
});

exports.recordCameraMetrics = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const session = await MockInterviewSession.findById(sessionId);
  if (!session) return sendError(res, 'Session not found', 404);
  if (String(session.user) !== String(req.user.id)) return sendError(res, 'Forbidden', 403);

  const metrics = analyzeCameraFrame(req.body || {});
  session.cameraMetrics.push({
    timestamp: new Date(),
    faceDetected: metrics.faceDetected,
    eyeContactScore: metrics.eyeContactScore,
    emotion: metrics.emotion,
    confidenceScore: metrics.confidenceScore,
    attentionScore: metrics.attentionScore,
    speakingIntensity: metrics.speakingIntensity,
  });

  session.scores.eyeContactScore = Math.round((session.scores.eyeContactScore + metrics.eyeContactScore) / 2);
  session.scores.confidenceScore = Math.round((session.scores.confidenceScore + metrics.confidenceScore) / 2);
  const averages = calculateSessionAverages(session);
  session.metrics = {
    ...session.metrics,
    ...averages,
  };
  await session.save();

  return res.apiSuccess({ metrics, feedback: metrics.feedback }, 'Camera metrics recorded');
});

exports.listSessions = asyncHandler(async (req, res) => {
  const sessions = await MockInterviewSession.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(20).lean();
  return res.apiSuccess({ sessions }, 'Sessions loaded');
});
