export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

export function buildHeuristicCameraMetrics({ focused = true, averageSpeechRate = 0 } = {}) {
  return {
    faceDetected: focused,
    eyeContactScore: focused ? 72 : 42,
    confidenceScore: focused ? 65 : 48,
    attentionScore: focused ? 68 : 45,
    emotion: focused ? 'neutral' : 'distracted',
    speakingIntensity: clamp((averageSpeechRate || 0) / 2),
    mode: 'heuristic',
  }
}

export function buildCameraFeedback(metrics) {
  return [
    metrics.eyeContactScore < 55 ? 'Look at the camera more consistently.' : null,
    metrics.attentionScore < 55 ? 'Re-center your focus on the interview panel.' : null,
    metrics.confidenceScore < 55 ? 'Slow down and speak with more confidence.' : null,
  ].filter(Boolean)
}

export function scoreCameraMetrics(metrics) {
  const eyeContactScore = clamp(metrics.eyeContactScore || 0)
  const confidenceScore = clamp(metrics.confidenceScore || 0)
  const attentionScore = clamp(metrics.attentionScore || 0)

  return {
    eyeContactScore,
    confidenceScore,
    attentionScore,
    confidenceIndicator: Math.round((eyeContactScore + confidenceScore + attentionScore) / 3),
  }
}

export function inferDominantEmotion(expressions = {}) {
  const expressionEntries = Object.entries(expressions)
  return expressionEntries.sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral'
}
