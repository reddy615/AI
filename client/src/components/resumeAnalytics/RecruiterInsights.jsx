import React from 'react'

export default function RecruiterInsights({ analysis = {} }) {
  const hiringProbability = analysis?.hiring_probability || Math.floor((analysis?.resume_quality||60) * 0.7)
  const topStrengths = analysis?.strengths || []
  const topWeaknesses = analysis?.weaknesses || []
  const risks = analysis?.ats_risks || []

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
      <h5 className="text-sm text-slate-300 mb-3">Recruiter Insights</h5>
      <p className="text-xs text-slate-400 mb-2">Hiring probability</p>
      <div className="w-full h-3 bg-slate-800 rounded overflow-hidden mb-3">
        <div className="h-full bg-gradient-to-r from-rose-400 to-emerald-400" style={{ width: `${hiringProbability}%` }} />
      </div>
      <div className="grid grid-cols-1 gap-3">
        <div>
          <p className="text-xs text-slate-400">Top Strengths</p>
          <ul className="text-sm text-slate-200 list-disc pl-5">{topStrengths.slice(0,3).map((s,i)=>(<li key={i}>{s}</li>))}</ul>
        </div>
        <div>
          <p className="text-xs text-slate-400">Top Weaknesses</p>
          <ul className="text-sm text-slate-200 list-disc pl-5">{topWeaknesses.slice(0,3).map((s,i)=>(<li key={i}>{s}</li>))}</ul>
        </div>
        <div>
          <p className="text-xs text-slate-400">ATS Rejection Risks</p>
          <ul className="text-sm text-rose-300 list-disc pl-5">{risks.slice(0,3).map((s,i)=>(<li key={i}>{s}</li>))}</ul>
        </div>
      </div>
    </div>
  )
}
