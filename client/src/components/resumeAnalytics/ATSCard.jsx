import React from 'react'
import AnimatedCounter from './AnimatedCounter'

export default function ATSCard({ label, value = 0, color = 'cyan' }) {
  const pct = Math.max(0, Math.min(100, Number(value)))
  const colorClass = color === 'emerald' ? 'from-emerald-400 to-emerald-600' : color === 'rose' ? 'from-rose-400 to-rose-600' : 'from-cyan-400 to-blue-500'
  return (
    <div className="rounded-xl border border-slate-700 bg-gradient-to-br p-4" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))' }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm text-slate-300">{label}</p>
          <p className="text-2xl font-semibold text-white"><AnimatedCounter value={pct} /></p>
        </div>
        <div className="w-16 h-16 rounded-full p-2 bg-slate-800/30 flex items-center justify-center">
          <div
            className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold`}
            style={{ boxShadow: `0 6px 18px rgba(56,189,248,0.08), 0 2px 6px rgba(2,6,23,0.6)` }}
          >
            {Math.round(pct)}
          </div>
        </div>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
