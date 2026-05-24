import React from 'react'
import MicrophoneTest from './MicrophoneTest'

export default function InterviewSidebar({ session, currentQuestion, onEnd, onNext, onSendTranscript, onStartRecording, onStopRecording, onDraftTranscriptChange, isRecording, transcript, audioStatus, cameraStatus }) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Session</div>
        <div className="mt-1 text-lg font-semibold text-slate-900">{session?.interviewType || 'Live Interview'}</div>
        <div className="text-sm text-slate-500">{session?.role || 'Role'} · {session?.experienceLevel || 'mid'}</div>
      </div>

      <div className="rounded-xl bg-slate-50 p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Current Question</div>
        <div className="mt-2 text-sm font-semibold text-slate-900">{currentQuestion?.question || 'Waiting for interview to start...'}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <button onClick={isRecording ? onStopRecording : onStartRecording} className={`rounded-xl px-4 py-3 font-semibold text-white ${isRecording ? 'bg-rose-600' : 'bg-emerald-600'}`}>
          {isRecording ? 'Stop Answer' : 'Record Answer'}
        </button>
        <button onClick={onNext} className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white">Next Question</button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <button onClick={onSendTranscript} className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white">Send Transcript</button>
        <button onClick={onEnd} className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700">End Interview</button>
      </div>

      <div className="space-y-2 text-sm text-slate-600">
        <div><span className="font-semibold text-slate-900">Audio:</span> {audioStatus}</div>
        <div><span className="font-semibold text-slate-900">Camera:</span> {cameraStatus}</div>
      </div>

      <MicrophoneTest />

      <label className="block space-y-2 text-sm font-medium text-slate-700">
        <span>Manual Transcript Fallback</span>
        <textarea
          rows="6"
          onChange={(event) => onDraftTranscriptChange?.(event.target.value)}
          placeholder="If microphone or webcam access is blocked, type your answer here and send it."
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
        />
      </label>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <div className="font-semibold text-slate-900">Live Transcript</div>
        <div className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap">{transcript || 'Transcript will appear here while you answer.'}</div>
      </div>
    </div>
  )
}
