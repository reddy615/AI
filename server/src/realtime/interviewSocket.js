const { verifyAccessToken } = require('../utils/jwt');
const { evaluateTranscript, buildFollowUpQuestions, appendSessionFeedback, calculateSessionAverages } = require('../services/mockInterviewService');
const { analyzeCameraFrame, summarizeCameraMetrics } = require('../services/cameraService');
const { findInterviewSessionById, serializeInterviewSession } = require('../services/interviewSessionStore');

function registerInterviewSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Unauthorized'));
      const decoded = verifyAccessToken(token);
      socket.user = { id: decoded.id, role: decoded.role };
      next();
    } catch (error) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    console.log('[mock-interview:socket] connection established', {
      socketId: socket.id,
      userId: socket.user?.id,
    });

    socket.on('interview:join', async ({ sessionId }) => {
      console.log('[mock-interview:socket] join request', {
        socketId: socket.id,
        userId: socket.user?.id,
        sessionId,
      });

      const session = await findInterviewSessionById(sessionId);
      if (!session || String(session.user) !== String(socket.user.id)) {
        socket.emit('interview:error', { message: 'Session not found or forbidden' });
        return;
      }

      socket.join(sessionId);
      console.log('[mock-interview:socket] joined room', {
        socketId: socket.id,
        sessionId,
      });

      if (session.status === 'created') {
        session.status = 'live';
        await session.save();
      }

      socket.emit('interview:session', {
        sessionId,
        session: serializeInterviewSession(session),
        currentQuestion: session.questions[session.currentQuestionIndex] || null,
        scores: session.scores,
        metrics: session.metrics,
      });
    });

    socket.on('interview:transcript', async ({ sessionId, transcript, questionId, cameraMetrics = [] }) => {
      const session = await findInterviewSessionById(sessionId);
      if (!session || String(session.user) !== String(socket.user.id)) return;

      const question = session.questions.find((item) => String(item.id) === String(questionId)) || session.questions[session.currentQuestionIndex] || session.questions[0];
      const evaluation = evaluateTranscript({
        transcript,
        interviewType: session.interviewType,
        question,
        cameraMetrics,
        audioMetrics: session.audioMetrics || [],
      });

      session.transcript.push({ role: 'candidate', text: transcript, timestamp: new Date(), confidence: evaluation.confidenceScore });
      appendSessionFeedback(session, evaluation);
      session.currentQuestionIndex = Math.min(session.currentQuestionIndex + 1, Math.max(session.questions.length - 1, 0));
      session.metrics = {
        ...session.metrics,
        ...calculateSessionAverages(session),
      };
      await session.save();

      io.to(sessionId).emit('interview:feedback', {
        evaluation,
        followUps: buildFollowUpQuestions({ interviewType: session.interviewType, responseText: transcript, question }),
        scores: session.scores,
        metrics: session.metrics,
      });

      io.to(sessionId).emit('interview:question', {
        currentQuestion: session.questions[session.currentQuestionIndex] || null,
        currentQuestionIndex: session.currentQuestionIndex,
      });
    });

    socket.on('interview:camera-metrics', async ({ sessionId, metrics }) => {
      const session = await findInterviewSessionById(sessionId);
      if (!session || String(session.user) !== String(socket.user.id)) return;

      const analyzed = analyzeCameraFrame(metrics || {});
      session.cameraMetrics.push({
        timestamp: new Date(),
        faceDetected: analyzed.faceDetected,
        eyeContactScore: analyzed.eyeContactScore,
        emotion: analyzed.emotion,
        confidenceScore: analyzed.confidenceScore,
        attentionScore: analyzed.attentionScore,
        speakingIntensity: analyzed.speakingIntensity,
      });
      session.scores.eyeContactScore = Math.round((session.scores.eyeContactScore + analyzed.eyeContactScore) / 2);
      session.scores.confidenceScore = Math.round((session.scores.confidenceScore + analyzed.confidenceScore) / 2);
      session.metrics = {
        ...session.metrics,
        ...summarizeCameraMetrics(session.cameraMetrics),
      };
      await session.save();

      socket.emit('interview:camera-feedback', {
        metrics: analyzed,
        scores: session.scores,
        summary: session.metrics,
      });
    });

    socket.on('interview:audio-metrics', async ({ sessionId, metrics }) => {
      const session = await findInterviewSessionById(sessionId);
      if (!session || String(session.user) !== String(socket.user.id)) return;
      const nextMetrics = Array.isArray(metrics) ? metrics : [metrics].filter(Boolean);
      session.audioMetrics.push(...nextMetrics.map((item) => ({
        timestamp: new Date(),
        transcript: item.transcript || '',
        wordsPerMinute: item.wordsPerMinute || 0,
        confidence: item.confidence || 0,
        sentiment: item.sentiment || 'neutral',
        clarityScore: item.clarityScore || 0,
      })));
      session.metrics.averageSpeechRate = Math.round((session.metrics.averageSpeechRate + (nextMetrics[0]?.wordsPerMinute || 0)) / 2);
      await session.save();

      socket.emit('interview:audio-feedback', {
        metrics: nextMetrics,
        scores: session.scores,
        summary: session.metrics,
      });
    });

    socket.on('interview:end', async ({ sessionId }) => {
      const session = await findInterviewSessionById(sessionId);
      if (!session || String(session.user) !== String(socket.user.id)) return;
      session.status = 'completed';
      session.endedAt = new Date();
      session.durationSeconds = session.startedAt ? Math.max(1, Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 1000)) : 0;
      session.scores.overallScore = Math.round((session.scores.communicationScore + session.scores.confidenceScore + session.scores.technicalAccuracyScore + session.scores.behavioralScore + session.scores.eyeContactScore) / 5);
      await session.save();

      io.to(sessionId).emit('interview:ended', { session: serializeInterviewSession(session) });
      socket.leave(sessionId);
    });

    socket.on('disconnect', () => {
      // no-op
    });
  });
}

module.exports = registerInterviewSocket;
