import React from 'react'

function colorForValue(v) {
  // v: 0-100
  const t = Math.max(0, Math.min(1, v/100))
  const r = Math.round(255 * t)
  const g = Math.round(100 + 155*(1-t))
  const b = Math.round(200 - 200*t)
  return `rgb(${r},${g},${b})`
}

export default function Heatmap({ matrix = [] }) {
  if (!matrix || !matrix.length) {
    return <div className="text-sm text-slate-400">No heatmap data</div>
  }

  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${matrix[0].length}, minmax(0,1fr))` }}>
      {matrix.flat().map((cell, i) => (
        <div key={i} className="h-8 rounded" title={`${cell}%`} style={{ background: colorForValue(cell) }} />
      ))}
    </div>
  )
}
