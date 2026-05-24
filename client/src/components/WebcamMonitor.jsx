import React from 'react'

export default function WebcamMonitor({ videoRef, cameraMetrics, loadingModels, modelStatus, modelState, feedback }) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Webcam Preview</div>
          <div className="text-sm font-semibold text-slate-900">{loadingModels ? 'Loading vision models…' : modelStatus}</div>
          <div className="mt-1 text-xs text-slate-500">{modelState?.status === 'ready' ? `Loaded at ${new Date(modelState.lastLoadedAt).toLocaleTimeString()}` : modelState?.status === 'fallback' ? 'Using heuristic fallback' : 'Initializing on demand'}</div>
        </div>
        <div className="text-xs text-slate-500">Eye contact, emotion, and attention tracking</div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-slate-950">
        <video ref={videoRef} autoPlay playsInline muted className="h-[320px] w-full object-cover" />
        <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
          {cameraMetrics?.faceDetected ? 'Face detected' : 'No face detected'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Eye Contact" value={`${Math.round(cameraMetrics?.eyeContactScore || 0)}%`} />
        <Metric label="Confidence" value={`${Math.round(cameraMetrics?.confidenceScore || 0)}%`} />
        <Metric label="Attention" value={`${Math.round(cameraMetrics?.attentionScore || 0)}%`} />
        <Metric label="Emotion" value={cameraMetrics?.emotion || 'neutral'} />
      </div>

      {feedback?.length ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-semibold">Camera feedback</div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {feedback.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ) : null}

      {modelState?.error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          Vision models could not load. The interview will continue in heuristic mode until the assets are available.
        </div>
      ) : null}
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  )
}
