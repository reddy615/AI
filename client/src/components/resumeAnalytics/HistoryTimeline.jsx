import React from 'react'

export default function HistoryTimeline({ items = [], onSelect=()=>{}, selected = null, loading=false }) {
  if (loading) return <div className="py-6 text-center text-slate-400">Loading history...</div>
  if (!items.length) return <div className="py-6 text-center text-slate-400">No analyses yet</div>

  return (
    <div className="space-y-3 max-h-80 overflow-auto">
      {items.map((it) => (
        <div key={it._id} onClick={() => onSelect(it)} className={`p-3 rounded-lg cursor-pointer border ${selected?._id===it._id ? 'border-cyan-500 bg-slate-800/50' : 'border-slate-700 hover:border-slate-600'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-200 font-semibold">{it.originalFile || 'Resume'}</p>
              <p className="text-xs text-slate-400">{new Date(it.createdAt).toLocaleString()}</p>
            </div>
            <div className="text-sm font-semibold text-white">{Math.round(it.analysis?.resume_quality || it.analysis?.resumeQuality || 0)}%</div>
          </div>
        </div>
      ))}
    </div>
  )
}
