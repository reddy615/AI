import React from 'react'

export default function ProgressBar({ value, max }){
  const pct = Math.round((value/max)*100)
  return (
    <div className="w-40">
      <div className="h-2 bg-gray-200 rounded">
        <div className="h-2 bg-blue-500 rounded" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-gray-600 mt-1">{value}/{max}</div>
    </div>
  )
}
