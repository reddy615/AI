import React, { useEffect, useMemo, useState } from 'react'
import api from '../api/api'
import Skeleton from '../components/Skeleton'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useLanguage } from '../context/LanguageContext'

function ProgressRing({ value = 0, max = 100 }) {
  const percent = Math.min(100, Math.round((Number(value) / Math.max(Number(max), 1)) * 100))
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="relative h-20 w-20 rounded-full bg-[conic-gradient(from_180deg,#0f172a_0%,#0f172a_var(--progress),#e2e8f0_var(--progress),#e2e8f0_100%)]" style={{ '--progress': `${percent}%` }}>
        <div className="absolute inset-[6px] rounded-full bg-white" />
        <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-900">{percent}%</div>
      </div>
      <div>
        <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Level Progress</div>
        <div className="mt-1 text-lg font-semibold text-slate-900">{value} / {max} XP</div>
      </div>
    </div>
  )
}

export default function GrowthDashboard() {
  const [learning, setLearning] = useState(null)
  const [gamification, setGamification] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [recommendationResponse, gamificationResponse, leaderboardResponse] = await Promise.all([
          api.get('/api/recommendations/personalized'),
          api.get('/api/gamification/me'),
          api.get('/api/gamification/leaderboard?limit=10'),
        ])

        setLearning(recommendationResponse.data.data || recommendationResponse.data)
        setGamification(gamificationResponse.data.data || gamificationResponse.data)
        setLeaderboard(leaderboardResponse.data.data?.leaderboard || leaderboardResponse.data.leaderboard || [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const metrics = useMemo(() => {
    const progress = gamification?.progress || {}
    return [
      { label: 'XP', value: progress.xp || 0, detail: `${gamification?.xpToNextLevel || 0} XP to next level` },
      { label: 'Level', value: progress.level || 1, detail: 'Current rank' },
      { label: 'Streak', value: progress.streak || 0, detail: `${progress.longestStreak || 0} day best` },
      { label: 'Badges', value: progress.badges?.length || 0, detail: 'Earned achievements' },
    ]
  }, [gamification])

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.35),_transparent_30%),linear-gradient(135deg,#0f172a_0%,#111827_45%,#1e293b_100%)] px-6 py-8 text-white shadow-2xl sm:px-8 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.28em] text-sky-300">Stage 4 Growth</p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{t('growth.title')}</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">{t('growth.subtitle')}</p>
          </div>
          <LanguageSwitcher className="text-white" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)
          : metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-sm uppercase tracking-[0.2em] text-slate-500">{metric.label}</div>
                <div className="mt-2 text-3xl font-bold text-slate-900">{metric.value}</div>
                <div className="mt-1 text-sm text-slate-500">{metric.detail}</div>
              </div>
            ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">AI Recommendations</h2>
                <p className="text-sm text-slate-500">Personalized based on weak areas and recent performance.</p>
              </div>
              {!loading && gamification?.progress ? <ProgressRing value={gamification.progress.xp || 0} max={gamification.nextLevelXp || 250} /> : null}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32" />)
              ) : learning?.recommendations?.length ? (
                learning.recommendations.map((recommendation) => (
                  <article key={recommendation.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">{recommendation.type}</span>
                      <span className="text-xs font-semibold text-slate-500">Priority {recommendation.priority}</span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-slate-900">{recommendation.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{recommendation.recommendation}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-white px-2.5 py-1">{recommendation.practiceType}</span>
                      <span className="rounded-full bg-white px-2.5 py-1">{recommendation.estimatedMinutes} min</span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">Complete a few assessments to generate recommendations.</div>
              )}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Study Plan</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-28" />)
              ) : learning?.studyPlan?.length ? (
                learning.studyPlan.map((step) => (
                  <div key={step.step} className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Step {step.step}</div>
                    <div className="mt-2 text-base font-semibold text-slate-900">{step.title}</div>
                    <div className="mt-2 text-sm text-slate-600">{step.description}</div>
                  </div>
                ))
              ) : null}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Learning Path</h2>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20" />)
              ) : learning?.learningPath?.length ? (
                learning.learningPath.map((item) => (
                  <div key={item.module} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.sequence}</div>
                        <div className="text-lg font-semibold text-slate-900">{item.label}</div>
                      </div>
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">Path</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{item.goal}</p>
                  </div>
                ))
              ) : null}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Badges</h2>
            <div className="mt-4 space-y-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20" />)
              ) : gamification?.progress?.badges?.length ? (
                gamification.progress.badges.map((badge) => (
                  <div key={badge.key} className="rounded-2xl bg-slate-50 p-4">
                    <div className="font-semibold text-slate-900">{badge.title}</div>
                    <div className="mt-1 text-sm text-slate-600">{badge.description}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">Badges appear after you complete sessions.</div>
              )}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Leaderboard</h2>
            <div className="mt-4 space-y-3">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-16" />)
              ) : leaderboard.length ? (
                leaderboard.map((entry) => (
                  <div key={entry.userId} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                    <div>
                      <div className="font-semibold text-slate-900">#{entry.rank} {entry.name}</div>
                      <div className="text-sm text-slate-500">Level {entry.level} · {entry.streak} day streak</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">{entry.xp} XP</div>
                      <div className="text-xs text-slate-500">{entry.badges?.length || 0} badges</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">Leaderboard unlocks after the first sessions.</div>
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}