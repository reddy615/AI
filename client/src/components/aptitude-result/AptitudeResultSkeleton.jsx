import React from 'react'

function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-2xl bg-white/8 ${className}`} />
}

export default function AptitudeResultSkeleton() {
  return (
    <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-[#030712] p-[1px] shadow-[0_45px_120px_-55px_rgba(56,189,248,0.7)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.14),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.12),_transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.94))]" />
      <div className="relative rounded-[2.45rem] border border-white/10 bg-slate-950/92 p-4 text-white sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <SkeletonBlock className="h-8 w-56 bg-white/10" />
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4 rounded-[1.75rem] border border-white/10 bg-white/6 p-6">
              <SkeletonBlock className="h-5 w-36 bg-white/10" />
              <SkeletonBlock className="h-12 w-3/4 bg-white/10" />
              <SkeletonBlock className="h-6 w-full bg-white/10" />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <SkeletonBlock key={index} className="h-24 bg-white/10" />
                ))}
              </div>
            </div>
            <SkeletonBlock className="h-[22rem] rounded-[1.75rem] bg-white/10" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-24 bg-white/10" />
            ))}
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <SkeletonBlock className="h-96 bg-white/10" />
            <SkeletonBlock className="h-96 bg-white/10" />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <SkeletonBlock className="h-64 bg-white/10" />
            <SkeletonBlock className="h-64 bg-white/10" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-48 bg-white/10" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
