const fs = require('fs');

async function transcribeWithOpenAI(audioBuffer, mimeType = 'audio/webm') {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !audioBuffer?.length) return null;

  const form = new FormData();
  form.append('file', new Blob([audioBuffer], { type: mimeType }), 'audio.webm');
  form.append('model', 'whisper-1');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data?.text || null;
}

async function transcribeWithDeepgram(audioBuffer, mimeType = 'audio/webm') {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey || !audioBuffer?.length) return null;

  const response = await fetch(`https://api.deepgram.com/v1/listen?model=${encodeURIComponent(process.env.DEEPGRAM_MODEL || 'nova-2')}&punctuate=true&smart_format=true`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': mimeType,
    },
    body: audioBuffer,
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || null;
}

async function transcribeAudio({ audioBuffer, mimeType }) {
  if (!audioBuffer?.length) return '';

  const deepgramTranscript = await transcribeWithDeepgram(audioBuffer, mimeType);
  if (deepgramTranscript) return deepgramTranscript;

  const openAITranscript = await transcribeWithOpenAI(audioBuffer, mimeType);
  if (openAITranscript) return openAITranscript;

  return '';
}

function estimateSpeechMetrics(transcript = '', durationMs = 0) {
  const text = String(transcript || '').trim();
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const minutes = Math.max(durationMs / 60000, 0.5);
  const wordsPerMinute = Math.round(words.length / minutes);
  const fillerCount = (text.match(/\b(um+|uh+|like|you know)\b/gi) || []).length;
  const clarityScore = Math.max(0, Math.min(100, 90 - fillerCount * 6 + Math.min(words.length, 120) / 3));
  const confidence = Math.max(0, Math.min(100, 60 + Math.min(words.length, 120) / 4 - fillerCount * 4));
  const sentiment = /excited|confident|passionate|love|enjoy/i.test(text)
    ? 'positive'
    : /difficult|challenge|hard|problem/i.test(text)
      ? 'neutral'
      : 'neutral';

  return {
    wordsPerMinute,
    confidence,
    sentiment,
    clarityScore: Math.round(clarityScore),
    fillerCount,
  };
}

module.exports = {
  transcribeAudio,
  estimateSpeechMetrics,
};
