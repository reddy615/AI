import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import api from '../api/api'
import Skeleton from '../components/Skeleton'
import LoadingOverlay from '../components/LoadingOverlay'
import { useToast } from '../components/ToastProvider'
import InterviewSidebar from '../components/InterviewSidebar'
import WebcamMonitor from '../components/WebcamMonitor'
import FeedbackPanel from '../components/FeedbackPanel'
import {
  analyzeFaceFrame,
  ensureFaceApiModels,
  getFaceApiModelState,
  isFaceApiReady,
} from '../services/faceApiService'
import { getApiBaseUrl } from '../utils/runtimeConfig'

const interviewTypes = [
  { value: 'hr', label: 'HR' },
  { value: 'technical', label: 'Technical' },
  { value: 'behavioral', label: 'Behavioral' },
]

const faceModelBaseUrl = '/models/face-api'

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

function getWebSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export default function MockInterview() {
  const [form, setForm] = useState({ interviewType: 'technical', role: 'Software Engineer', experienceLevel: 'mid', weakAreas: '' })
  const [session, setSession] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [loadingSession, setLoadingSession] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelStatus, setModelStatus] = useState('models not loaded')
  const [modelState, setModelState] = useState(getFaceApiModelState())
  const [cameraMetrics, setCameraMetrics] = useState({ faceDetected: false, eyeContactScore: 0, confidenceScore: 0, attentionScore: 0, emotion: 'neutral' })
  const [cameraFeedback, setCameraFeedback] = useState([])
  const [scores, setScores] = useState({ communicationScore: 0, confidenceScore: 0, technicalAccuracyScore: 0, behavioralScore: 0, eyeContactScore: 0, overallScore: 0 })
  const [metrics, setMetrics] = useState({ averageSpeechRate: 0, averageEyeContact: 0, averageConfidence: 0, averageAttention: 0 })
  const [transcript, setTranscript] = useState('')
  const [liveTranscript, setLiveTranscript] = useState('')
  const [draftTranscript, setDraftTranscript] = useState('')
  const [followUps, setFollowUps] = useState([])
  const [realTimeStatus, setRealTimeStatus] = useState('')
  const [feedBackItems, setFeedBackItems] = useState([])
  const [audioStatus, setAudioStatus] = useState('Idle')
  const [isRecording, setIsRecording] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [endedSession, setEndedSession] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [assistantNote, setAssistantNote] = useState('Start an interview to hear the AI interviewer ask your first question.')
  const toast = useToast()

  const videoRef = useRef(null)
  const cameraStreamRef = useRef(null)
  const audioStreamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const socketRef = useRef(null)
  const speechRecognitionRef = useRef(null)
  const elapsedIntervalRef = useRef(null)
  const cameraLoopRef = useRef(null)
  const modelsReadyRef = useRef(false)
  const interviewStartedAtRef = useRef(null)

  const resetTranscriptState = useCallback(() => {
    setTranscript('')
    setLiveTranscript('')
    setDraftTranscript('')
    setFollowUps([])
    setRealTimeStatus('')
    setFeedBackItems([])
    setCameraFeedback([])
    setAudioStatus('Idle')
    setIsRecording(false)
    setSessionEnded(false)
    setEndedSession(null)
    setAssistantNote('Start an interview to hear the AI interviewer ask your first question.')
  }, [])

  const attachSocket = useCallback((nextSession) => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }

    const socket = io(getApiBaseUrl(), {
      transports: ['websocket'],
      auth: { token: localStorage.getItem('token') },
    })

    socket.on('connect', () => {
      if (nextSession?._id) {
        socket.emit('interview:join', { sessionId: nextSession._id })
      }
    })

    socket.on('interview:session', ({ session: liveSession, currentQuestion: nextQuestion, scores: nextScores, metrics: nextMetrics }) => {
      setSession(liveSession)
      setCurrentQuestion(nextQuestion)
      setScores(nextScores || liveSession?.scores || {})
      setMetrics(nextMetrics || liveSession?.metrics || {})
      setAssistantNote(nextQuestion?.question || 'AI interviewer is preparing the next question.')
    })

    socket.on('interview:feedback', ({ evaluation, followUps: nextFollowUps, scores: nextScores, metrics: nextMetrics }) => {
      if (evaluation?.summary) {
        setRealTimeStatus(evaluation.summary)
      }
      if (Array.isArray(nextFollowUps)) {
        setFollowUps(nextFollowUps)
      }
      if (nextScores) {
        setScores(nextScores)
      }
      if (nextMetrics) {
        setMetrics(nextMetrics)
      }
      setFeedBackItems((current) => [...current, ...(evaluation?.feedback || [])].slice(-8))
    })

    socket.on('interview:question', ({ currentQuestion: nextQuestion }) => {
      setCurrentQuestion(nextQuestion)
      setAssistantNote(nextQuestion?.question || 'Waiting for the next AI interviewer question.')
      speakQuestion(nextQuestion?.question)
    })

    socket.on('interview:camera-feedback', ({ metrics: nextMetrics, scores: nextScores, summary }) => {
      if (nextMetrics) {
        setCameraMetrics(nextMetrics)
        setCameraFeedback(nextMetrics.feedback || [])
      }
      if (nextScores) setScores(nextScores)
      if (summary) setMetrics(summary)
      if (Array.isArray(nextMetrics?.feedback)) {
        setFeedBackItems((current) => [...current, ...nextMetrics.feedback].slice(-8))
      }
    })

    socket.on('interview:audio-feedback', ({ metrics: nextMetrics, scores: nextScores, summary }) => {
      if (nextScores) setScores(nextScores)
      if (summary) setMetrics(summary)
      if (nextMetrics?.[0]) {
        setTranscript((current) => current || nextMetrics[0].transcript || '')
        setAudioStatus(`Audio analyzed at ${nextMetrics[0].wordsPerMinute || 0} wpm`)
      }
    })

    socket.on('interview:ended', ({ session: completedSession }) => {
      setSessionEnded(true)
      setEndedSession(completedSession)
      setSession(completedSession)
      setScores(completedSession?.scores || {})
      setMetrics(completedSession?.metrics || {})
      setAssistantNote('Interview finished. Review the score summary and feedback below.')
      stopRecording()
    })

    socket.on('interview:error', ({ message }) => {
      setAssistantNote(message || 'Socket error')
    })

    socketRef.current = socket
  }, [])

  const loadFaceModels = useCallback(async () => {
    setLoadingModels(true)
    try {
      const nextState = await ensureFaceApiModels()
      setModelState(nextState)
      modelsReadyRef.current = Boolean(nextState.loaded)
      setModelStatus(nextState.message || (nextState.loaded ? 'vision models ready' : 'heuristic vision mode'))
    } catch (error) {
      console.warn('Face models not available, falling back to heuristic camera metrics.', error)
      toast.error('Face analysis is unavailable. Continuing in fallback mode.')
      modelsReadyRef.current = false
      setModelState(getFaceApiModelState())
      setModelStatus('heuristic vision mode')
    } finally {
      setLoadingModels(false)
    }
  }, [])

  const initCamera = useCallback(async () => {
    console.log('[mock-interview:camera] requesting getUserMedia', {
      secureContext: window.isSecureContext,
      hasMediaDevices: Boolean(navigator.mediaDevices),
      cameraPermission: navigator.permissions ? 'queryable' : 'not-supported',
    })

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('navigator.mediaDevices.getUserMedia is not available')
    }

    const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    cameraStreamRef.current = videoStream
    if (videoRef.current) {
      videoRef.current.srcObject = videoStream
      await videoRef.current.play()
    }

    try {
      audioStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    } catch (audioError) {
      audioStreamRef.current = null
      console.warn('[mock-interview:camera] microphone unavailable', audioError)
    }

    console.log('[mock-interview:camera] camera stream started', {
      videoTracks: videoStream.getVideoTracks().map((track) => track.label),
      audioTracks: audioStreamRef.current?.getAudioTracks().map((track) => track.label) || [],
    })

    return { videoStream, audioStream: audioStreamRef.current }
  }, [])

  const stopCamera = useCallback(() => {
    if (cameraLoopRef.current) {
      clearInterval(cameraLoopRef.current)
      cameraLoopRef.current = null
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop())
      cameraStreamRef.current = null
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop())
      audioStreamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const analyzeFrame = useCallback(async () => {
    if (!videoRef.current) return
    const nextMetrics = await analyzeFaceFrame(videoRef.current, { averageSpeechRate: metrics.averageSpeechRate })
    modelsReadyRef.current = Boolean(isFaceApiReady())
    setModelState(nextMetrics.modelState || getFaceApiModelState())
    setModelStatus(nextMetrics.modelState?.message || (nextMetrics.modelState?.loaded ? 'vision models ready' : 'heuristic vision mode'))
    setCameraMetrics(nextMetrics)
    setCameraFeedback(nextMetrics.feedback || [])
    socketRef.current?.emit('interview:camera-metrics', { sessionId: session?._id, metrics: nextMetrics })
    return nextMetrics
  }, [metrics.averageSpeechRate, session?._id])

  const startCameraLoop = useCallback(() => {
    if (cameraLoopRef.current) clearInterval(cameraLoopRef.current)
    cameraLoopRef.current = setInterval(() => {
      analyzeFrame().catch((error) => console.error(error))
    }, 2500)
  }, [analyzeFrame])

  const startSpeechRecognition = useCallback(() => {
    const Recognition = getWebSpeechRecognition()
    if (!Recognition) return null
    const recognition = new Recognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onresult = (event) => {
      const transcriptText = Array.from(event.results)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
      setLiveTranscript(transcriptText)
    }
    recognition.onerror = (event) => {
      console.error('Speech recognition error', event)
    }
    recognition.start()
    speechRecognitionRef.current = recognition
    return recognition
  }, [])

  const stopSpeechRecognition = useCallback(() => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop()
      } catch (error) {
        console.warn(error)
      }
      speechRecognitionRef.current = null
    }
  }, [])

  const startRecording = useCallback(async () => {
    if (!session?._id) return
    if (!cameraStreamRef.current) {
      await initCamera()
    }

    if (!audioStreamRef.current) {
      try {
        audioStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      } catch (audioError) {
        console.warn('[mock-interview:camera] microphone unavailable for recording', audioError)
      }
    }

    const audioTrack = audioStreamRef.current?.getAudioTracks?.()[0]
    if (!audioTrack) {
      setAudioStatus('Microphone unavailable')
      return
    }

    recordedChunksRef.current = []
    const recordingStream = new MediaStream([audioTrack])
    const recorder = new MediaRecorder(recordingStream, { mimeType: 'audio/webm' })
    recorder.ondataavailable = (event) => {
      if (event.data?.size) recordedChunksRef.current.push(event.data)
    }
    recorder.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
      const formData = new FormData()
      formData.append('audio', blob, 'answer.webm')
      formData.append('durationMs', String(Math.max(1000, elapsedSeconds * 1000)))
      formData.append('transcript', liveTranscript || transcript)

      setAudioStatus('Transcribing answer…')
      try {
        const response = await api.post(`/api/mock-interviews/${session._id}/transcribe`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        const payload = response.data.data || response.data
        const nextTranscript = payload.transcript || liveTranscript || transcript
        setTranscript(nextTranscript)
        setAudioStatus(`Transcript ready (${payload.speechMetrics?.wordsPerMinute || 0} wpm)`)
        socketRef.current?.emit('interview:audio-metrics', { sessionId: session._id, metrics: payload.speechMetrics ? [payload.speechMetrics] : [] })
        socketRef.current?.emit('interview:transcript', {
          sessionId: session._id,
          transcript: nextTranscript,
          questionId: currentQuestion?.id,
          cameraMetrics,
        })
      } catch (error) {
        console.error(error)
        setAudioStatus('Failed to transcribe answer')
      }
    }

    recorder.start()
    mediaRecorderRef.current = recorder
    setIsRecording(true)
    setAudioStatus('Recording answer...')
    startSpeechRecognition()
  }, [cameraMetrics, currentQuestion?.id, elapsedSeconds, initCamera, liveTranscript, session, startSpeechRecognition, transcript])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    setAudioStatus('Processing answer...')
    stopSpeechRecognition()
  }, [stopSpeechRecognition])

  const sendTranscript = useCallback(async () => {
    if (!session?._id) return
    const text = transcript || liveTranscript || draftTranscript
    if (!text.trim()) {
      setAssistantNote('Please record or type an answer before sending it.')
      return
    }

    try {
      setTranscript(text)
      socketRef.current?.emit('interview:transcript', {
        sessionId: session._id,
        transcript: text,
        questionId: currentQuestion?.id,
        cameraMetrics,
      })
      setRealTimeStatus('Answer submitted for real-time evaluation.')
      setAssistantNote('AI interviewer is analyzing your response and preparing the next question.')
      setDraftTranscript('')
    } catch (error) {
      console.error(error)
    }
  }, [cameraMetrics, currentQuestion?.id, draftTranscript, liveTranscript, session, transcript])

  const nextQuestion = useCallback(() => {
    if (!session?._id) return
    socketRef.current?.emit('interview:transcript', {
      sessionId: session._id,
      transcript: transcript || liveTranscript || draftTranscript || 'No response submitted.',
      questionId: currentQuestion?.id,
      cameraMetrics,
    })
  }, [cameraMetrics, currentQuestion?.id, draftTranscript, liveTranscript, session, transcript])

  const endInterview = useCallback(async () => {
    if (!session?._id) return
    try {
      socketRef.current?.emit('interview:end', { sessionId: session._id })
      const response = await api.post(`/api/mock-interviews/${session._id}/end`)
      const payload = response.data.data || response.data
      setEndedSession(payload.session)
      setSession(payload.session)
      setSessionEnded(true)
    } catch (error) {
      console.error(error)
    }
  }, [session])

  const startInterview = async (event) => {
    event.preventDefault()
    setLoadingSession(true)
    console.log('[mock-interview:start] submit clicked', {
      interviewType: form.interviewType,
      role: form.role,
      experienceLevel: form.experienceLevel,
      weakAreas: form.weakAreas,
    })

    try {
      const weakAreas = form.weakAreas.split(',').map((item) => item.trim()).filter(Boolean)
      const response = await api.post('/api/mock-interviews/start', {
        interviewType: form.interviewType,
        role: form.role,
        experienceLevel: form.experienceLevel,
        weakAreas,
      })

      console.log('[mock-interview:start] API response', {
        status: response.status,
        data: response.data,
      })

      const payload = response.data.data || response.data
      const nextSession = payload.session
      console.log('[mock-interview:start] parsed session', {
        sessionId: nextSession?._id,
        status: nextSession?.status,
        questionCount: nextSession?.questions?.length || 0,
      })

      setSession(nextSession)
      setCurrentQuestion(nextSession?.questions?.[0] || null)
      setScores(nextSession?.scores || scores)
      setMetrics(nextSession?.metrics || metrics)
      setTranscript('')
      setLiveTranscript('')
      setDraftTranscript('')
      setFollowUps([])
      setFeedBackItems([])
      setAssistantNote(nextSession?.questions?.[0]?.question || 'AI interviewer is preparing the first question.')
      attachSocket(nextSession)
      await loadFaceModels()
      try {
        await initCamera()
        setModelStatus('camera ready')
        setAudioStatus('Camera and microphone ready')
        startCameraLoop()
      } catch (cameraError) {
        console.warn('Camera/microphone unavailable, continuing in text mode.', cameraError)
        toast.error('Camera or microphone unavailable. You can continue in text mode.')
        setModelStatus('camera unavailable - text mode')
        setAudioStatus('Text mode available')
      }
      interviewStartedAtRef.current = Date.now()
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current)
      elapsedIntervalRef.current = setInterval(() => setElapsedSeconds(Math.floor((Date.now() - interviewStartedAtRef.current) / 1000)), 1000)
    } catch (error) {
      console.error('[mock-interview:start] failed', error)
      toast.error('Unable to start the mock interview. Please try again.')
      setAssistantNote('Failed to start the interview session.')
    } finally {
      setLoadingSession(false)
    }
  }

  useEffect(() => {
    const idleCallback = window.requestIdleCallback
      ? window.requestIdleCallback(() => {
        loadFaceModels().catch(() => {})
      })
      : window.setTimeout(() => {
        loadFaceModels().catch(() => {})
      }, 800)

    return () => {
      if (window.cancelIdleCallback && typeof idleCallback === 'number') {
        window.cancelIdleCallback(idleCallback)
      } else {
        clearTimeout(idleCallback)
      }
    }
  }, [loadFaceModels])

  useEffect(() => {
    if (currentQuestion?.question) {
      speakQuestion(currentQuestion.question)
    }
  }, [currentQuestion?.question])

  useEffect(() => {
    console.log('[mock-interview:state] session changed', {
      hasSession: Boolean(session),
      sessionId: session?._id,
      status: session?.status,
      questionCount: session?.questions?.length || 0,
      currentQuestion: currentQuestion?.question || null,
      loadingSession,
      loadingModels,
      modelStatus,
      cameraStatus: modelStatus,
      isRecording,
    })
  }, [currentQuestion?.question, isRecording, loadingModels, loadingSession, modelStatus, session])

  useEffect(() => {
    return () => {
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current)
      if (cameraLoopRef.current) clearInterval(cameraLoopRef.current)
      if (socketRef.current) socketRef.current.disconnect()
      stopSpeechRecognition()
      stopCamera()
    }
  }, [stopCamera, stopSpeechRecognition])

  const speakQuestion = useCallback((questionText) => {
    if (!questionText || !window.speechSynthesis) return
    const utterance = new SpeechSynthesisUtterance(questionText)
    utterance.rate = 0.95
    utterance.pitch = 1.0
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }, [])

  const combinedTranscript = useMemo(() => [liveTranscript, transcript, draftTranscript].filter(Boolean).join('\n').trim(), [draftTranscript, liveTranscript, transcript])

  return (
    <div className="space-y-8 relative">
      <LoadingOverlay
        visible={loadingSession || loadingModels}
        title={loadingSession ? 'Starting interview' : 'Loading interview models'}
        subtitle={loadingSession ? 'Preparing your live AI mock interview session.' : 'Loading webcam and feedback models.'}
      />
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-8 text-white shadow-xl sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.25em] text-indigo-300">Stage 3 Mock Interview</p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">AI interviewer, webcam analysis, voice interaction, and real-time scoring.</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
              Start an HR, technical, or behavioral interview and get live feedback on communication, confidence, eye contact, and response quality.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-slate-100 backdrop-blur">
            <div>Elapsed: {elapsedSeconds}s</div>
            <div>Live score: {Math.round(scores.overallScore || 0)}</div>
          </div>
        </div>
      </section>

      {!session ? (
        <form onSubmit={startInterview} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-2 premium-card">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Interview Type
            <select name="interviewType" value={form.interviewType} onChange={(event) => setForm((current) => ({ ...current, interviewType: event.target.value }))} className="rounded-xl border border-slate-300 px-4 py-3">
              {interviewTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Target Role
            <input value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} className="rounded-xl border border-slate-300 px-4 py-3" />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Experience Level
            <select value={form.experienceLevel} onChange={(event) => setForm((current) => ({ ...current, experienceLevel: event.target.value }))} className="rounded-xl border border-slate-300 px-4 py-3">
              <option value="junior">Junior</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 lg:col-span-2">
            Weak Areas
            <input value={form.weakAreas} onChange={(event) => setForm((current) => ({ ...current, weakAreas: event.target.value }))} className="rounded-xl border border-slate-300 px-4 py-3" placeholder="arrays, leadership, system design" />
          </label>
          <div className="lg:col-span-2 flex items-center gap-3">
            <button type="submit" className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
              {loadingSession ? 'Starting...' : 'Start Interview'}
            </button>
            <span className="text-sm text-slate-500">The AI interviewer will ask the first question automatically.</span>
          </div>
        </form>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
          <div className="space-y-6">
            <WebcamMonitor
              videoRef={videoRef}
              cameraMetrics={cameraMetrics}
              loadingModels={loadingModels}
              modelStatus={modelStatus}
              modelState={modelState}
              feedback={cameraFeedback}
            />

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm premium-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">AI Interviewer</div>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">{currentQuestion?.question || 'Waiting for the AI interviewer...'}</h2>
                </div>
                <button onClick={() => speakQuestion(currentQuestion?.question)} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Repeat Question</button>
              </div>
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{assistantNote}</div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <div><span className="font-semibold text-slate-900">Role:</span> {session.role}</div>
                <div><span className="font-semibold text-slate-900">Type:</span> {session.interviewType}</div>
                <div><span className="font-semibold text-slate-900">Current Question:</span> {currentQuestion?.order != null ? currentQuestion.order + 1 : 1}</div>
              </div>
            </div>

            <FeedbackPanel
              scores={scores}
              metrics={metrics}
              feedback={feedBackItems}
              followUps={followUps}
              realTimeStatus={realTimeStatus}
            />
          </div>

          <InterviewSidebar
            session={session}
            currentQuestion={currentQuestion}
            transcript={combinedTranscript}
            audioStatus={audioStatus}
            cameraStatus={modelStatus}
            isRecording={isRecording}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onSendTranscript={sendTranscript}
            onNext={nextQuestion}
            onEnd={endInterview}
            onDraftTranscriptChange={setDraftTranscript}
          />
        </div>
      )}

      {sessionEnded && endedSession ? (
        <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-2 premium-card">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Session Summary</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <SummaryCard label="Overall Score" value={endedSession.scores?.overallScore || 0} />
              <SummaryCard label="Communication" value={endedSession.scores?.communicationScore || 0} />
              <SummaryCard label="Confidence" value={endedSession.scores?.confidenceScore || 0} />
              <SummaryCard label="Eye Contact" value={endedSession.scores?.eyeContactScore || 0} />
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              {endedSession.summary || 'Your interview is complete. Review the recommendations on the dashboard for follow-up practice.'}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Recommendations</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              {feedBackItems.length ? feedBackItems.map((item) => <div key={item} className="rounded-xl bg-slate-50 p-4">{item}</div>) : <Skeleton className="h-24" />}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{Math.round(value || 0)}</div>
    </div>
  )
}
