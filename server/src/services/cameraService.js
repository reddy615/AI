function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function analyzeCameraFrame(frame = {}) {
  const faceDetected = Boolean(frame.faceDetected ?? true);
  const eyeContactScore = clamp(frame.eyeContactScore ?? frame.eyeContact ?? 70);
  const confidenceScore = clamp(frame.confidenceScore ?? frame.confidence ?? 65);
  const attentionScore = clamp(frame.attentionScore ?? frame.attention ?? 68);
  const emotion = frame.emotion || 'neutral';
  const speakingIntensity = clamp(frame.speakingIntensity ?? 40);

  return {
    faceDetected,
    eyeContactScore,
    confidenceScore,
    attentionScore,
    emotion,
    speakingIntensity,
    alertLevel: attentionScore < 45 ? 'high' : attentionScore < 65 ? 'medium' : 'low',
    feedback: [
      eyeContactScore < 55 ? 'Improve eye contact by looking into the webcam more often.' : null,
      attentionScore < 55 ? 'Reduce distractions and keep your attention on the interview.' : null,
      confidenceScore < 55 ? 'Slow down and speak with more confidence.' : null,
    ].filter(Boolean),
  };
}

function summarizeCameraMetrics(metrics = []) {
  if (!metrics.length) {
    return {
      averageEyeContact: 0,
      averageConfidence: 0,
      averageAttention: 0,
      detectedEmotions: [],
    };
  }

  const total = metrics.length;
  const averageEyeContact = metrics.reduce((sum, item) => sum + clamp(item.eyeContactScore || 0), 0) / total;
  const averageConfidence = metrics.reduce((sum, item) => sum + clamp(item.confidenceScore || 0), 0) / total;
  const averageAttention = metrics.reduce((sum, item) => sum + clamp(item.attentionScore || 0), 0) / total;
  const detectedEmotions = [...new Set(metrics.map((item) => item.emotion).filter(Boolean))];

  return {
    averageEyeContact: Math.round(averageEyeContact),
    averageConfidence: Math.round(averageConfidence),
    averageAttention: Math.round(averageAttention),
    detectedEmotions,
  };
}

module.exports = {
  analyzeCameraFrame,
  summarizeCameraMetrics,
};
