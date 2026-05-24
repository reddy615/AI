import * as faceapi from 'face-api.js'

import {
  buildCameraFeedback,
  buildHeuristicCameraMetrics,
  clamp,
  inferDominantEmotion,
  scoreCameraMetrics,
} from '../utils/cameraAnalysis'

const MODEL_BASE_URL = import.meta.env.VITE_FACE_API_MODEL_URL || '/models/face-api'

let loadPromise = null
let modelState = {
  status: 'idle',
  message: 'models not loaded',
  loaded: false,
  lastLoadedAt: null,
  error: null,
}

function updateState(partial) {
  modelState = { ...modelState, ...partial }
  return modelState
}

async function loadFaceApiModels() {
  updateState({ status: 'loading', message: 'Loading vision models…', error: null })
  const loaders = [
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_BASE_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_BASE_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_BASE_URL),
  ]

  await Promise.all(loaders)
  return updateState({
    status: 'ready',
    message: 'vision models ready',
    loaded: true,
    lastLoadedAt: new Date().toISOString(),
    error: null,
  })
}

async function ensureFaceApiModels() {
  if (modelState.loaded) return modelState
  if (!loadPromise) {
    loadPromise = loadFaceApiModels().catch((error) => {
      console.warn('Face models not available, falling back to heuristic camera metrics.', error)
      return updateState({
        status: 'fallback',
        message: 'camera unavailable - text mode',
        loaded: false,
        error: error?.message || 'failed to load face-api models',
      })
    }).finally(() => {
      loadPromise = null
    })
  }

  return loadPromise
}

function getFaceApiModelState() {
  return { ...modelState }
}

function isFaceApiReady() {
  return modelState.loaded === true
}

async function analyzeFaceFrame(videoElement, { averageSpeechRate = 0 } = {}) {
  const focused = typeof document !== 'undefined' ? document.hasFocus() : true
  const fallback = buildHeuristicCameraMetrics({ focused, averageSpeechRate })

  if (!videoElement || !isFaceApiReady()) {
    return {
      ...fallback,
      feedback: buildCameraFeedback(fallback),
      modelState: getFaceApiModelState(),
    }
  }

  try {
    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
      .withFaceLandmarks()
      .withFaceExpressions()

    if (!detection) {
      return {
        ...fallback,
        faceDetected: false,
        feedback: buildCameraFeedback(fallback),
        modelState: getFaceApiModelState(),
      }
    }

    const expressions = detection.expressions || {}
    const dominantEmotion = inferDominantEmotion(expressions)
    const bbox = detection.detection.box
    const frameWidth = videoElement.videoWidth || 640
    const frameHeight = videoElement.videoHeight || 480
    const centerX = bbox.x + bbox.width / 2
    const centerY = bbox.y + bbox.height / 2
    const normalizedOffsetX = Math.abs(centerX - frameWidth / 2) / frameWidth
    const normalizedOffsetY = Math.abs(centerY - frameHeight / 2) / frameHeight

    const eyeContactScore = clamp(100 - ((normalizedOffsetX + normalizedOffsetY) / 2) * 140)
    const confidenceScore = clamp(55 + (expressions.neutral || 0) * 30 + (expressions.happy || 0) * 15 - (expressions.fearful || 0) * 10)
    const attentionScore = clamp(78 - (expressions.sad || 0) * 20 - (expressions.angry || 0) * 10)
    const metrics = scoreCameraMetrics({ eyeContactScore, confidenceScore, attentionScore })

    return {
      faceDetected: true,
      eyeContactScore: metrics.eyeContactScore,
      confidenceScore: metrics.confidenceScore,
      attentionScore: metrics.attentionScore,
      emotion: dominantEmotion,
      speakingIntensity: clamp(averageSpeechRate / 2),
      confidenceIndicator: metrics.confidenceIndicator,
      feedback: buildCameraFeedback(metrics),
      modelState: getFaceApiModelState(),
    }
  } catch (error) {
    updateState({ status: 'fallback', message: 'camera unavailable - text mode', error: error?.message || 'face analysis failed' })
    return {
      ...fallback,
      feedback: buildCameraFeedback(fallback),
      modelState: getFaceApiModelState(),
    }
  }
}

export {
  MODEL_BASE_URL,
  analyzeFaceFrame,
  ensureFaceApiModels,
  getFaceApiModelState,
  isFaceApiReady,
}
