import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoadingOverlay({ visible, title = 'Loading', subtitle = 'Please wait while the content loads.', progress }) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 px-4 py-6 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-lg rounded-[28px] border border-white/10 bg-slate-950/95 p-6 text-center shadow-2xl shadow-slate-950/40 backdrop-blur-xl"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-cyan-400 shadow-lg shadow-cyan-500/10">
              <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" opacity="0.25" />
                <path d="M22 12a10 10 0 00-10-10" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
            {typeof progress === 'number' ? (
              <div className="mt-5 rounded-full bg-slate-800 p-1">
                <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300" style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
              </div>
            ) : (
              <div className="mt-5 h-2 rounded-full bg-slate-800/70">
                <div className="h-full w-full animate-shimmer rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </div>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
