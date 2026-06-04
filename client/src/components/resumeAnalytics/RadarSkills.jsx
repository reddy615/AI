import React from 'react'
import { Radar } from 'react-chartjs-2'
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

export default function RadarSkills({ data = {} }) {
  const labels = Object.keys(data).length ? Object.keys(data) : ['Technical', 'Communication', 'Leadership', 'Product', 'Tools']
  const values = labels.map((k) => data[k]?.score || data[k] || 0)
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Skill Categories',
        data: values,
        backgroundColor: 'rgba(56,189,248,0.15)',
        borderColor: 'rgba(56,189,248,0.9)',
        pointBackgroundColor: 'rgba(56,189,248,1)'
      }
    ]
  }

  const opts = { responsive: true, maintainAspectRatio: false, scales: { r: { beginAtZero: true, suggestedMax: 100 } } }

  return (
    <div className="h-64 rounded-lg bg-slate-800/30 p-2">
      <Radar data={chartData} options={opts} />
    </div>
  )
}
