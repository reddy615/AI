import React from 'react'
import { motion } from 'framer-motion'

export default function ConfidenceMeter({ value = 0 }) {
  const pct = Math.max(0, Math.min(100, Number(value)))
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
      <h5 className="text-sm text-slate-300 mb-2">AI Confidence</h5>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="h-2 bg-slate-800 rounded overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-emerald-400 to-cyan-500" />
          </div>
          <p className="text-xs text-slate-400 mt-2">Model confidence: <span className="text-white font-semibold">{pct}%</span></p>
        </div>
        <div className="w-20 h-20 rounded-full bg-slate-800/20 flex items-center justify-center">
          <div className="text-white font-bold text-lg">{pct}%</div>
        </div>
      </div>
    </div>
  )
}
