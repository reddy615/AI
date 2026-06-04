import React from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export default function TrendGraph({ series = [] }) {
  const labels = series.map(s=>s.label)
  const data = { labels, datasets: [{ label: 'Score', data: series.map(s=>s.value), borderColor: 'rgba(99,102,241,0.9)', backgroundColor: 'rgba(99,102,241,0.12)' }] }
  const opts = { responsive: true, maintainAspectRatio: false, animation: { duration: 800 } }
  return <div className="h-44 rounded-lg bg-slate-800/30 p-2"><Line data={data} options={opts} /></div>
}
