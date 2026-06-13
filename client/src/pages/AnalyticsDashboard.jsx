import React, { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../api/api'
import Skeleton from '../components/Skeleton'
import StatsCard from '../components/StatsCard'
import PerformanceLineChart from '../components/PerformanceLineChart'
import LoadingOverlay from '../components/LoadingOverlay'
import { useToast } from '../components/ToastProvider'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Activity, CheckCircle2, CircleSlash2, Target } from 'lucide-react'

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [overviewResponse, leaderboardResponse] = await Promise.all([
        api.get('/api/analytics/overview'),
        api.get('/api/coding/leaderboard'),
      ])
      setAnalytics(overviewResponse.data.data?.analytics || overviewResponse.data.analytics)
      setLeaderboard(leaderboardResponse.data.data?.leaderboard || leaderboardResponse.data.leaderboard || [])
    } catch (error) {
      console.error(error)
      toast.error('Unable to load analytics data. Please try again later.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const moduleData = useMemo(() => {
    if (!analytics?.moduleBreakdown) return []
    return Object.entries(analytics.moduleBreakdown).map(([module, value]) => ({ module, score: value.score, attempts: value.attempts, correct: value.correct, wrong: value.wrong }))
  }, [analytics])

  const topicData = useMemo(() => {
    if (Array.isArray(analytics?.topicAnalytics)) return analytics.topicAnalytics
    if (!analytics?.byTopic) return []
    return Object.entries(analytics.byTopic).map(([topic, stats]) => ({ topic, ...stats }))
  }, [analytics])

  const scoreTrends = analytics?.quizScores?.map((item, index) => ({ index: index + 1, score: item.score, accuracy: Math.round((item.correct / Math.max(item.correct + item.wrong + item.skipped, 1)) * 100) })) || []

  return (
    <div className="space-y-8 relative">
      <LoadingOverlay
        visible={loading}
        title="Loading analytics"
        subtitle="Fetching performance metrics and leaderboard details."
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-blue-600">Analytics</p>
          <h1 className="text-3xl font-bold text-slate-900">Performance Intelligence</h1>
          <p className="mt-2 text-sm text-slate-500">Track quiz performance, module strength, coding leaderboard standing, and weak areas.</p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)
          : [
              { label: 'Quiz Attempts', value: analytics?.summary?.totalQuizAttempts || 0, description: 'Completed assessments' },
              { label: 'Coding Attempts', value: analytics?.summary?.totalCodingAttempts || 0, description: 'Coding runs submitted' },
              { label: 'Average Accuracy', value: `${analytics?.summary?.averageAccuracy || 0}%`, description: 'Overall quiz accuracy' },
              { label: 'Best Coding Score', value: analytics?.summary?.bestCodingScore || 0, description: 'Highest coding score' },
            ].map((card) => <StatsCard key={card.label} {...card} />)}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.08)] premium-card">
          <PerformanceLineChart data={scoreTrends} />
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.08)] premium-card">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Module Breakdown</h3>
            <p className="text-sm text-slate-500">Aggregate scores by module.</p>
          </div>
          <div className="h-80">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="module" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="score" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-violet-600">Topic Analytics</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Performance by topic</h2>
          <p className="mt-1 text-sm text-slate-500">Accuracy, score, and answer distribution across every attempted topic.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-64" />)
          ) : topicData.length ? (
            topicData.map((topic) => (
              <article key={topic.topic} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
                      <Activity className="h-4 w-4" />
                      Topic
                    </div>
                    <h3 className="mt-2 text-xl font-bold text-slate-900">{topic.topic}</h3>
                    <p className="mt-1 text-sm text-slate-500">{topic.total || 0} questions attempted</p>
                  </div>
                  <div className="rounded-2xl bg-slate-900 px-3 py-2 text-right text-white">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-300">Accuracy</div>
                    <div className="text-2xl font-black">{topic.accuracy || 0}%</div>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Progress</span>
                    <span className="font-semibold text-slate-900">Score {topic.score || 0}</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-500 transition-[width] duration-500"
                      style={{ width: `${Math.max(0, Math.min(Number(topic.accuracy) || 0, 100))}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-emerald-50 p-3 text-center text-emerald-700">
                    <CheckCircle2 className="mx-auto h-4 w-4" />
                    <div className="mt-1 text-lg font-bold">{topic.correct || 0}</div>
                    <div className="text-xs">Correct</div>
                  </div>
                  <div className="rounded-2xl bg-rose-50 p-3 text-center text-rose-700">
                    <Target className="mx-auto h-4 w-4" />
                    <div className="mt-1 text-lg font-bold">{topic.wrong || 0}</div>
                    <div className="text-xs">Wrong</div>
                  </div>
                  <div className="rounded-2xl bg-slate-100 p-3 text-center text-slate-600">
                    <CircleSlash2 className="mx-auto h-4 w-4" />
                    <div className="mt-1 text-lg font-bold">{topic.skipped || 0}</div>
                    <div className="text-xs">Skipped</div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 md:col-span-2 xl:col-span-3">
              Complete a quiz to populate topic-wise analytics.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Weak Areas</h3>
          <div className="mt-4 space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20" />)
            ) : analytics?.weakAreas?.length ? (
              analytics.weakAreas.map((area) => (
                <div key={area.topic} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{area.topic}</div>
                      <div className="text-sm text-slate-500">{area.correct} correct · {area.wrong} wrong · {area.skipped} skipped</div>
                    </div>
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{area.accuracy}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">Weak areas will be detected after more attempts.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Coding Leaderboard</h3>
          <div className="mt-4 space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-16" />)
            ) : leaderboard.length ? (
              leaderboard.map((entry, index) => (
                <div key={entry.id || index} className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <div>
                    <div className="font-semibold text-slate-900">#{index + 1} {entry.challenge}</div>
                    <div className="text-sm text-slate-500">{entry.language} · {entry.submissions || 0} submissions</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900">{entry.bestScore}</div>
                    <div className="text-xs text-slate-500">{entry.bestRuntimeMs || 0} ms</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">Run coding challenges to populate the leaderboard.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
