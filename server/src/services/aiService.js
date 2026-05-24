const AIQuestion = require('../models/AIQuestion');

function buildFallbackQuestions({ module, difficulty, count, weakAreas = [] }) {
  const topicsByModule = {
    aptitude: ['arithmetic', 'percentages', 'algebra', 'ratio'],
    reasoning: ['series', 'syllogism', 'direction', 'puzzles'],
    verbal: ['grammar', 'vocabulary', 'reading comprehension', 'sentence improvement'],
    hr: ['strengths', 'conflict', 'leadership', 'motivation'],
    technical: ['data structures', 'system design', 'api design', 'debugging'],
  };

  const topicPool = topicsByModule[module] || topicsByModule.technical;
  const selectedTopics = weakAreas.length ? weakAreas : topicPool;

  return Array.from({ length: count }, (_, index) => {
    const topic = selectedTopics[index % selectedTopics.length];
    return {
      module,
      difficulty,
      prompt: `Generate a ${difficulty} ${module} interview question about ${topic}.`,
      question: `What is a strong ${module} question about ${topic}?`,
      answer: `A sample answer for ${topic}.`,
      explanation: `This is a locally generated fallback because no AI provider is configured.`,
      tags: [module, topic, difficulty],
      source: 'fallback',
    };
  });
}

async function callOpenAI(payload) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.4,
      messages: [
        { role: 'system', content: 'Return JSON only with questions array. Each item must contain question, answer, explanation, and tags.' },
        { role: 'user', content: JSON.stringify(payload) },
      ],
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || '';
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

async function callGemini(payload) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-1.5-flash'}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `Return JSON only with questions array. Payload: ${JSON.stringify(payload)}` }],
        },
      ],
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('') || '';
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

async function generateQuestions({ userId, module, difficulty, count, candidateProfile = {} }) {
  const payload = {
    userId,
    module,
    difficulty,
    count,
    candidateProfile,
  };

  const provider = (process.env.AI_PROVIDER || 'mock').toLowerCase();
  let generated = null;

  if (provider === 'openai') {
    generated = await callOpenAI(payload);
  } else if (provider === 'gemini') {
    generated = await callGemini(payload);
  }

  const questions = Array.isArray(generated?.questions) && generated.questions.length
    ? generated.questions
    : buildFallbackQuestions({ module, difficulty, count, weakAreas: candidateProfile.weakAreas || [] });

  const docs = questions.map((entry) => ({
    user: userId,
    module,
    difficulty,
    prompt: entry.prompt || `Generate a ${difficulty} ${module} question.`,
    question: entry.question || entry.prompt || `Question for ${module}`,
    answer: entry.answer || '',
    explanation: entry.explanation || '',
    tags: entry.tags || [module, difficulty],
    source: generated?.questions ? provider : 'fallback',
    candidateProfile,
  }));

  const saved = await AIQuestion.insertMany(docs);
  return saved;
}

module.exports = {
  generateQuestions,
};
