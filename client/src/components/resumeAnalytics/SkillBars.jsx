import React from 'react'

export default function SkillBars({ skills = {} }) {
  const entries = Object.keys(skills).length ? Object.keys(skills).map(k=>({k, v: skills[k]?.score || skills[k] || 0})) : [ {k:'JavaScript', v:80}, {k:'React', v:75}, {k:'Node', v:70} ]
  return (
    <div className="space-y-3">
      {entries.map((e, idx) => (
        <div key={idx} className="">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-slate-300">{e.k}</p>
            <p className="text-sm text-white font-semibold">{e.v}%</p>
          </div>
          <div className="h-2 bg-slate-800 rounded overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${e.v}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
