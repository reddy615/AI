import React from 'react'

export default function StatsCard({ label, value, description, accent = 'bg-blue-500' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-4 h-2 w-16 rounded-full ${accent}`} />
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{description}</div>
    </div>
  )
}
