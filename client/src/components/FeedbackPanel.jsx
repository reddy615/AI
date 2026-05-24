import React from 'react'

export default function FeedbackPanel({ scores, metrics, feedback, followUps, realTimeStatus }) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Real-time Feedback</div>
        <div className="mt-1 text-lg font-semibold text-slate-900">{realTimeStatus || 'Awaiting your response...'}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <ScoreTile label="Communication" value={scores?.communicationScore || 0} />
        <ScoreTile label="Confidence" value={scores?.confidenceScore || 0} />
        <ScoreTile label="Technical" value={scores?.technicalAccuracyScore || 0} />
        <ScoreTile label="Behavioral" value={scores?.behavioralScore || 0} />
        <ScoreTile label="Eye Contact" value={scores?.eyeContactScore || 0} />
        <ScoreTile label="Overall" value={scores?.overallScore || 0} highlight />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Live Metrics</div>
          <div className="mt-2 space-y-1 text-sm text-slate-700">
            <div>Speech rate: {metrics?.averageSpeechRate || 0} wpm</div>
            <div>Eye contact: {Math.round(metrics?.averageEyeContact || 0)}%</div>
            <div>Attention: {Math.round(metrics?.averageAttention || 0)}%</div>
            <div>Confidence: {Math.round(metrics?.averageConfidence || 0)}%</div>
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Follow-up Questions</div>
          <ul className="mt-2 space-y-2 text-sm text-slate-700">
            {(followUps || []).length ? followUps.map((item) => <li key={item}>• {item}</li>) : <li>Respond to see AI follow-ups.</li>}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Coach Notes</div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {(feedback || []).length ? feedback.map((item) => <li key={item}>{item}</li>) : <li>AI feedback will appear here after each answer.</li>}
        </ul>
      </div>
    </div>
  )
}

function ScoreTile({ label, value, highlight = false }) {
  return (
    <div className={`rounded-xl p-4 text-center ${highlight ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className={`text-xs uppercase tracking-[0.18em] ${highlight ? 'text-slate-300' : 'text-slate-500'}`}>{label}</div>
      <div className="mt-1 text-2xl font-bold">{Math.round(value)}</div>
    </div>
  )
}
