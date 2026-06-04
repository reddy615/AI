import React from 'react'
import { motion } from 'framer-motion'
import AnimatedCounter from './AnimatedCounter'

export default function CircularProgress({ value = 0, size = 80, stroke = 8, color = 'cyan' }) {
  const pct = Math.max(0, Math.min(100, Number(value)))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference
  const gradientId = `grad-${color}-${size}`

  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${size/2},${size/2})`}>
          <circle r={radius} cx="0" cy="0" fill="none" stroke="#0f172a" strokeWidth={stroke} />
          <motion.circle
            r={radius}
            cx="0"
            cy="0"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            style={{ filter: 'url(#glow)', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </g>
      </svg>
      <div className="text-sm">
        <div className="text-white font-semibold"><AnimatedCounter value={pct} />%</div>
        <div className="text-xs text-slate-400">confidence</div>
      </div>
    </div>
  )
}
