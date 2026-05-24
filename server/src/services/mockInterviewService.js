const MockInterviewSession = require('../models/MockInterviewSession');

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function buildFallbackQuestions({ interviewType, role, experienceLevel, count = 6 }) {
  const templates = {
    hr: [
      'Tell me about yourself and how your background fits this role.',
      'Describe a time you handled conflict on a team.',
      'Why do you want to work here and what motivates you?',
      'How do you handle ambiguity and shifting priorities?',
    ],
    technical: [
      `Explain a system you built and the key tradeoffs you made for a ${role} role.`,
      'How would you design a scalable interview practice platform?',
      'Describe how you would troubleshoot a production latency issue.',
      'What are the key differences between a blocking and non-blocking architecture?',
    ],
    behavioral: [
      'Tell me about a difficult challenge you solved under pressure.',
      'How do you prioritize tasks when deadlines are tight?',
      'Describe a time you received critical feedback and how you responded.',
      'What does good teamwork look like to you?',
    ],
  };

  const pool = templates[interviewType] || templates.technical;
  const questions = [];

  for (let index = 0; index < count; index += 1) {
    const question = pool[index % pool.length];
    questions.push({
      id: `${interviewType}-${Date.now()}-${index}`,
      question: `${question} (Level: ${experienceLevel})`,
      followUps: [
        'Can you expand on that with a concrete example?',
        'What would you do differently if you faced that again?',
      ],
      idealSignals: ['structured response', 'specific example', 'clear outcome'],
      order: index,
    });
  }

  return questions;
}

async function callOpenAIInterview({ interviewType, role, experienceLevel, weakAreas = [] }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.MOCK_INTERVIEW_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.5,
      messages: [
        {
          role: 'system',
          content: 'Return JSON only with a questions array. Each item should include question, followUps, and idealSignals.',
        },
        {
          role: 'user',
          content: JSON.stringify({ interviewType, role, experienceLevel, weakAreas }),
        },
      ],
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content || '';
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function evaluateTranscript({ transcript, interviewType, question, cameraMetrics = [], audioMetrics = [] }) {
  const text = String(transcript || '').trim();
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const fillerCount = (text.match(/\b(um+|uh+|like|you know)\b/gi) || []).length;
  const eyeAverage = cameraMetrics.length
    ? cameraMetrics.reduce((sum, item) => sum + clamp(item.eyeContactScore || 0), 0) / cameraMetrics.length
    : 65;
  const confidenceAverage = cameraMetrics.length
    ? cameraMetrics.reduce((sum, item) => sum + clamp(item.confidenceScore || 0), 0) / cameraMetrics.length
    : 60;
  const attentionAverage = cameraMetrics.length
    ? cameraMetrics.reduce((sum, item) => sum + clamp(item.attentionScore || 0), 0) / cameraMetrics.length
    : 60;
  const speakingAverage = audioMetrics.length
    ? audioMetrics.reduce((sum, item) => sum + clamp(item.wordsPerMinute || 0), 0) / audioMetrics.length
    : 0;

  const baseCommunication = clamp(45 + Math.min(wordCount, 180) / 3 - fillerCount * 5);
  const technicalIndicators = /system|architecture|api|database|performance|async|scal|tradeoff|design|algorithm/i.test(text)
    ? 78
    : 58;
  const behavioralIndicators = /team|conflict|feedback|lead|priorit|deadline|challenge/i.test(text)
    ? 80
    : 60;

  const overallScore = clamp(
    baseCommunication * 0.28 +
    confidenceAverage * 0.18 +
    eyeAverage * 0.15 +
    attentionAverage * 0.1 +
    technicalIndicators * (interviewType === 'technical' ? 0.18 : 0.08) +
    behavioralIndicators * (interviewType === 'behavioral' ? 0.18 : 0.08) +
    (speakingAverage ? clamp(55 + speakingAverage / 2) * 0.05 : 0)
  );

  const feedback = [];
  if (fillerCount > 1) feedback.push('Reduce filler words to sound more confident.');
  if (eyeAverage < 55) feedback.push('Improve eye contact by looking at the camera more consistently.');
  if (confidenceAverage < 60) feedback.push('Slow down slightly and speak with more confidence.');
  if (wordCount < 35) feedback.push('Add more detail and structure to your response.');
  if (interviewType === 'technical' && !/tradeoff|scal|complex|latency|cache|database/i.test(text)) {
    feedback.push('Include tradeoffs or implementation details for stronger technical depth.');
  }

  const scoreDelta = clamp(overallScore - 60, -20, 20);

  return {
    communicationScore: clamp(baseCommunication),
    confidenceScore: clamp(confidenceAverage),
    technicalAccuracyScore: clamp(technicalIndicators),
    behavioralScore: clamp(behavioralIndicators),
    eyeContactScore: clamp(eyeAverage),
    overallScore,
    feedback,
    scoreDelta,
    summary: feedback.length ? feedback[0] : 'Solid response. Keep the answers structured and concise.',
  };
}

function buildFollowUpQuestions({ interviewType, responseText, question }) {
  const text = String(responseText || '');
  const followUps = [];
  if (/team|conflict|lead|feedback/i.test(text)) {
    followUps.push('What did you learn from that situation?');
  }
  if (/design|system|architecture|database|api/i.test(text)) {
    followUps.push('What tradeoff did you prioritize and why?');
  }
  if (!followUps.length) {
    followUps.push(`Can you provide a more concrete example related to ${interviewType} interviews?`);
  }
  followUps.push(`How would you summarize your answer to: ${question.question}`);
  return followUps.slice(0, 2);
}

async function createSession({ userId, interviewType, role, experienceLevel, weakAreas = [] }) {
  const aiResponse = await callOpenAIInterview({ interviewType, role, experienceLevel, weakAreas });
  const generatedQuestions = Array.isArray(aiResponse?.questions) && aiResponse.questions.length
    ? aiResponse.questions
    : buildFallbackQuestions({ interviewType, role, experienceLevel, count: 6 });

  const questions = generatedQuestions.map((item, index) => ({
    id: item.id || `${interviewType}-${Date.now()}-${index}`,
    question: item.question || item.prompt || 'Tell me about your experience.',
    followUps: item.followUps || [
      'Can you elaborate on that?',
      'What would you improve the next time?',
    ],
    idealSignals: item.idealSignals || ['clarity', 'example', 'structure'],
    order: index,
  }));

  return MockInterviewSession.create({
    user: userId,
    interviewType,
    role,
    experienceLevel,
    status: 'created',
    questions,
    startedAt: new Date(),
    transcript: [],
    cameraMetrics: [],
    audioMetrics: [],
    feedback: [],
    scores: {
      communicationScore: 0,
      confidenceScore: 0,
      technicalAccuracyScore: 0,
      behavioralScore: 0,
      eyeContactScore: 0,
      overallScore: 0,
    },
    metrics: {
      averageSpeechRate: 0,
      averageEyeContact: 0,
      averageConfidence: 0,
      averageAttention: 0,
    },
  });
}

function calculateSessionAverages(session) {
  const cameraMetrics = session.cameraMetrics || [];
  const audioMetrics = session.audioMetrics || [];

  const averageEyeContact = cameraMetrics.length
    ? cameraMetrics.reduce((sum, item) => sum + clamp(item.eyeContactScore || 0), 0) / cameraMetrics.length
    : 0;
  const averageConfidence = cameraMetrics.length
    ? cameraMetrics.reduce((sum, item) => sum + clamp(item.confidenceScore || 0), 0) / cameraMetrics.length
    : 0;
  const averageAttention = cameraMetrics.length
    ? cameraMetrics.reduce((sum, item) => sum + clamp(item.attentionScore || 0), 0) / cameraMetrics.length
    : 0;
  const averageSpeechRate = audioMetrics.length
    ? audioMetrics.reduce((sum, item) => sum + clamp(item.wordsPerMinute || 0), 0) / audioMetrics.length
    : 0;

  const overallScore = clamp(
    session.scores.communicationScore * 0.25 +
    session.scores.confidenceScore * 0.2 +
    session.scores.technicalAccuracyScore * 0.2 +
    session.scores.behavioralScore * 0.15 +
    session.scores.eyeContactScore * 0.2
  );

  return {
    averageEyeContact: clamp(averageEyeContact),
    averageConfidence: clamp(averageConfidence),
    averageAttention: clamp(averageAttention),
    averageSpeechRate: Math.round(averageSpeechRate),
    overallScore,
  };
}

function appendSessionFeedback(session, evaluation) {
  if (!evaluation) return session;
  const feedbackEntries = Array.isArray(evaluation.feedback) ? evaluation.feedback : [];

  feedbackEntries.forEach((message) => {
    session.feedback.push({
      message,
      scoreDelta: evaluation.scoreDelta || 0,
      category: 'ai-feedback',
    });
  });

  session.scores.communicationScore = clamp(evaluation.communicationScore || session.scores.communicationScore);
  session.scores.confidenceScore = clamp(evaluation.confidenceScore || session.scores.confidenceScore);
  session.scores.technicalAccuracyScore = clamp(evaluation.technicalAccuracyScore || session.scores.technicalAccuracyScore);
  session.scores.behavioralScore = clamp(evaluation.behavioralScore || session.scores.behavioralScore);
  session.scores.eyeContactScore = clamp(evaluation.eyeContactScore || session.scores.eyeContactScore);
  session.scores.overallScore = clamp(evaluation.overallScore || session.scores.overallScore);

  const averages = calculateSessionAverages(session);
  session.metrics = {
    ...session.metrics,
    ...averages,
  };

  return session;
}

module.exports = {
  createSession,
  evaluateTranscript,
  buildFollowUpQuestions,
  appendSessionFeedback,
  calculateSessionAverages,
  buildFallbackQuestions,
};
