import React from 'react'

export default function InsightsCard({ title, items = [], kind = 'info' }) {
  return (
    <div className="rounded-lg p-4 bg-slate-800/30 border border-slate-700">
      <h5 className="text-sm text-slate-300 mb-2">{title}</h5>
      <div className="text-sm text-slate-200 space-y-2">
        {(!items || items.length===0) ? (
          <p className="text-slate-400">No suggestions</p>
        ) : (
          items.slice(0,6).map((it, i) => <p key={i} className="truncate">• {it}</p>)
        )}
      </div>
    </div>
  )
}
