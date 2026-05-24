const { getRedisClient } = require('../config/redis');
const { getUserAnalytics } = require('./analyticsService');

const DEFAULT_TOPICS = {
  aptitude: ['percentages', 'ratio', 'algebra', 'time and work'],
  reasoning: ['series', 'puzzles', 'syllogism', 'direction sense'],
  verbal: ['grammar', 'reading comprehension', 'vocabulary', 'sentence improvement'],
  hr: ['conflict resolution', 'leadership', 'motivation', 'ownership'],
  technical: ['data structures', 'system design', 'debugging', 'api design'],
  coding: ['arrays', 'graphs', 'dynamic programming', 'sorting'],
};

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function buildFallbackPlan(analytics, context = {}) {
  const weakAreas = (analytics?.weakAreas || context.weakAreas || []).slice(0, 5);
  const modules = Object.keys(DEFAULT_TOPICS);
  const topicPool = weakAreas.length
    ? weakAreas.map((area) => area.topic)
    : (DEFAULT_TOPICS[context.module] || DEFAULT_TOPICS.technical);

  const recommendations = topicPool.slice(0, 5).map((topic, index) => ({
    id: `${normalizeText(topic)}-${index}`,
    type: index % 2 === 0 ? 'topic' : 'coding',
    topic,
    title: `Focus on ${topic}`,
    priority: weakAreas[index]?.accuracy !== undefined ? Math.max(1, 100 - weakAreas[index].accuracy) : 50 - index * 5,
    recommendation: weakAreas[index]
      ? `You are at ${weakAreas[index].accuracy}% accuracy on ${topic}. Review ${weakAreas[index].wrong + weakAreas[index].skipped} questions, then complete a 15-minute timed set.`
      : `Run a short practice set on ${topic} and compare the result against your last attempt.`,
    practiceType: index % 2 === 0 ? 'timed-practice' : 'coding-drill',
    estimatedMinutes: index % 2 === 0 ? 20 : 30,
  }));

  const studyPlan = [
    { step: 1, title: 'Review weak areas', description: 'Read explanations for the lowest-accuracy topics.' },
    { step: 2, title: 'Practice with constraints', description: 'Use timed sessions to simulate interview pressure.' },
    { step: 3, title: 'Re-run the assessment', description: 'Retest with a shorter question set and compare progress.' },
  ];

  const learningPath = modules.map((module, index) => ({
    module,
    label: module.toUpperCase(),
    sequence: index + 1,
    goal: `Reach consistent proficiency in ${module}.`,
  }));

  return {
    recommendations,
    studyPlan,
    learningPath,
    summary: {
      weakAreasCount: weakAreas.length,
      generatedAt: new Date().toISOString(),
      source: 'fallback',
    },
  };
}

async function callMlService(payload) {
  const baseUrl = String(process.env.ML_SERVICE_URL || '').trim().replace(/\/$/, '');
  if (!baseUrl) return null;

  try {
    const response = await fetch(`${baseUrl}/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function callOpenAIEmbeddings(payload) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const weakText = payload.weakAreas.map((area) => `${area.topic} ${area.accuracy} ${area.correct} ${area.wrong} ${area.skipped}`).join(' | ');
  const candidateTopics = payload.candidateTopics.length ? payload.candidateTopics : DEFAULT_TOPICS[payload.module] || DEFAULT_TOPICS.technical;
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
      input: [weakText, ...candidateTopics],
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const embeddings = data?.data?.map((item) => item.embedding) || [];
  if (embeddings.length < 2) return null;

  const [profileEmbedding, ...topicEmbeddings] = embeddings;
  const scores = topicEmbeddings.map((embedding, index) => ({
    topic: candidateTopics[index],
    score: cosineSimilarity(profileEmbedding, embedding),
  }));

  const sorted = scores.sort((left, right) => right.score - left.score);
  return sorted.map((entry, index) => ({
    id: `${normalizeText(entry.topic)}-${index}`,
    type: index % 2 === 0 ? 'topic' : 'coding',
    topic: entry.topic,
    title: `Focus on ${entry.topic}`,
    priority: Math.round(entry.score * 100),
    recommendation: `Practice ${entry.topic} next. The embeddings model ranked it as highly relevant to your current weak areas.`,
    practiceType: index % 2 === 0 ? 'timed-practice' : 'coding-drill',
    estimatedMinutes: index % 2 === 0 ? 20 : 30,
  }));
}

function cosineSimilarity(left, right) {
  const length = Math.min(left.length, right.length);
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }

  const divisor = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  return divisor ? dot / divisor : 0;
}

async function getPersonalizedRecommendations(userId, context = {}) {
  const redis = getRedisClient();
  const cacheKey = `recommendations:${userId}:${context.module || 'all'}`;
  const cacheTtl = Number(process.env.RECOMMENDATION_CACHE_TTL_SECONDS || 600);

  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  const analytics = await getUserAnalytics(userId);
  const payload = {
    userId,
    module: context.module || 'technical',
    weakAreas: (context.weakAreas || analytics.weakAreas || []).slice(0, 5),
    candidateTopics: context.candidateTopics || [],
  };

  const fromMlService = await callMlService(payload);
  const fromEmbeddings = fromMlService?.recommendations || await callOpenAIEmbeddings(payload);
  const fallback = buildFallbackPlan(analytics, context);

  const result = fromEmbeddings
    ? {
        ...fallback,
        recommendations: fromEmbeddings,
        summary: {
          ...fallback.summary,
          source: fromMlService ? 'fastapi' : 'openai-embeddings',
        },
      }
    : fallback;

  result.analytics = {
    weakAreas: analytics.weakAreas || [],
    summary: analytics.summary,
  };

  if (redis) {
    await redis.set(cacheKey, JSON.stringify(result), 'EX', cacheTtl);
  }

  return result;
}

module.exports = {
  buildFallbackPlan,
  getPersonalizedRecommendations,
};