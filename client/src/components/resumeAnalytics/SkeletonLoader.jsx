import React from 'react'

export default function SkeletonLoader({ className = 'h-6 w-full' }) {
  return (
    <div className={`animate-pulse bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded ${className}`} />
  )
}
