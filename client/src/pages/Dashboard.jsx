import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import api from '../api/api'
import Skeleton from '../components/Skeleton'
import StatsCard from '../components/StatsCard'
import PerformanceLineChart from '../components/PerformanceLineChart'
import LoadingOverlay from '../components/LoadingOverlay'
import { useToast } from '../components/ToastProvider'
import { clearAuth } from '../store/store'

function formatPercent(value) {
  return `${Number(value || 0)}%`
}

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [gamification, setGamification] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const toast = useToast()

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const [profileResponse, analyticsResponse, recommendationsResponse, gamificationResponse] = await Promise.all([
        api.get('/api/auth/me'),
        api.get('/api/analytics/overview'),
        api.get('/api/analytics/recommendations'),
        api.get('/api/gamification/me'),
      ])

      const profileData = profileResponse.data.data || profileResponse.data
      const analyticsData = analyticsResponse.data.data?.analytics || analyticsResponse.data.analytics
      const recommendationsData = recommendationsResponse.data.data?.recommendations || recommendationsResponse.data.recommendations || []
      const gamificationData = gamificationResponse.data.data || gamificationResponse.data

      setUser(profileData)
      setAnalytics(analyticsData)
      setRecommendations(recommendationsData)
      setGamification(gamificationData)
    } catch (error) {
      console.error(error)
      toast.error('Unable to load dashboard metrics. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const logout = async () => {
    try {
      await api.post('/api/auth/logout')
    } catch (error) {
      console.error(error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      dispatch(clearAuth())
      navigate('/', { replace: true })
    }
  }

  const summaryCards = useMemo(() => {
    if (!analytics?.summary) return []

    return [
      { label: 'Quiz Attempts', value: analytics.summary.totalQuizAttempts, description: 'Practice sessions completed', accent: 'bg-blue-500' },
      { label: 'Coding Attempts', value: analytics.summary.totalCodingAttempts, description: 'Coding submissions evaluated', accent: 'bg-violet-500' },
      { label: 'Average Accuracy', value: formatPercent(analytics.summary.averageAccuracy), description: 'Across all quiz attempts', accent: 'bg-emerald-500' },
      { label: 'Best Quiz Score', value: analytics.summary.bestQuizScore, description: 'Highest score achieved', accent: 'bg-amber-500' },
      { label: 'XP', value: gamification?.progress?.xp || 0, description: 'Gamification points earned', accent: 'bg-sky-500' },
      { label: 'Streak', value: gamification?.progress?.streak || 0, description: 'Days in a row practicing', accent: 'bg-rose-500' },
    ]
  }, [analytics, gamification])

  return (
    <div className="space-y-8 relative">
      <LoadingOverlay
        visible={loading}
        title="Loading dashboard"
        subtitle="Loading your performance summary and recommendations."
      />
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-6 py-8 text-white shadow-xl sm:px-8 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.25em] text-sky-300">Stage 2 Intelligence</p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Analytics-driven interview practice, coding drills, and AI-generated questions.</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
              Personalized difficulty, performance graphs, weak-area detection, and coding practice powered by the same secure backend.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadDashboard}
              disabled={loading}
              className="rounded-full border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button onClick={() => navigate('/ai')} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow transition hover:bg-slate-100">Generate AI Questions</button>
            <button onClick={() => navigate('/coding')} className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">Open Coding Lab</button>
            <button onClick={() => navigate('/analytics')} className="rounded-full border border-white/20 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">View Analytics</button>
            <button onClick={() => navigate('/growth')} className="rounded-full bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300">Open Growth Hub</button>
            <button onClick={() => navigate('/interview')} className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300">Start Mock Interview</button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32" />)
          : summaryCards.map((card) => <StatsCard key={card.label} {...card} />)}
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {loading ? (
            <Skeleton className="h-[24rem]" />
          ) : (
            <PerformanceLineChart data={analytics?.quizScores?.map((item, index) => ({ index: index + 1, score: item.score, accuracy: analytics?.quizScores?.length ? Math.round((item.correct / Math.max(item.correct + item.wrong + item.skipped, 1)) * 100) : 0 })) || []} />
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Weak Areas</h3>
                <p className="text-sm text-slate-500">Use these topics for the next AI-generated practice set.</p>
              </div>
              <Link to="/analytics" className="text-sm font-medium text-blue-600 hover:text-blue-700">See detailed breakdown</Link>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24" />)
              ) : analytics?.weakAreas?.length ? (
                analytics.weakAreas.map((area) => (
                  <div key={area.topic} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-slate-900">{area.topic}</h4>
                      <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">{formatPercent(area.accuracy)}</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-600">Correct: {area.correct} · Wrong: {area.wrong} · Skipped: {area.skipped}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">Complete a few assessments to surface weak areas here.</div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Profile</h3>
            {loading ? (
              <div className="mt-4 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-5 w-40" />
              </div>
            ) : (
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p><span className="font-semibold text-slate-900">Name:</span> {user?.name}</p>
                <p><span className="font-semibold text-slate-900">Email:</span> {user?.email}</p>
                <p><span className="font-semibold text-slate-900">Role:</span> {user?.role}</p>
                <p><span className="font-semibold text-slate-900">Resume:</span> {user?.resume ? 'Uploaded' : 'Not uploaded'}</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Recommendations</h3>
            <div className="mt-4 space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-20" />)
              ) : recommendations.length ? (
                recommendations.map((recommendation) => (
                  <div key={recommendation.id || recommendation.topic} className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                    <div className="font-semibold text-slate-900">{recommendation.topic || recommendation.area}</div>
                    <div className="mt-1">{recommendation.recommendation}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">Recommendations will appear after a few completed assessments.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
                <p className="text-sm text-slate-500">Latest quiz and XP updates from your practice sessions.</p>
              </div>
              <Link to="/analytics" className="text-sm font-medium text-blue-600 hover:text-blue-700">See full activity</Link>
            </div>
            <div className="mt-4 space-y-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-16" />)
              ) : gamification?.progress?.recentActivities?.length ? (
                gamification.progress.recentActivities.slice(0, 5).map((activity, index) => (
                  <div key={`${activity.type}-${index}`} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900 capitalize">{activity.source.replace('-', ' ')}</span>
                      <span className="text-slate-500">+{activity.xp} XP</span>
                    </div>
                    <div className="mt-1 text-slate-500">Score: {activity.score ?? 'N/A'} · Module: {activity.module || 'General'}</div>
                    <div className="mt-1 text-xs text-slate-400">{new Date(activity.createdAt).toLocaleString()}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">Your completed quizzes and XP earnings will show here.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
            <div className="mt-4 grid gap-3">
              <button onClick={() => navigate('/quiz?module=aptitude&count=10')} className="rounded-xl bg-slate-900 px-4 py-3 text-left text-sm font-semibold text-white">Practice Aptitude</button>
              <button onClick={() => navigate('/quiz?module=reasoning&count=10')} className="rounded-xl bg-slate-800 px-4 py-3 text-left text-sm font-semibold text-white">Practice Reasoning</button>
              <button onClick={() => navigate('/quiz?module=verbal&count=10')} className="rounded-xl bg-slate-700 px-4 py-3 text-left text-sm font-semibold text-white">Practice Verbal</button>
              <button onClick={() => navigate('/coding')} className="rounded-xl bg-blue-600 px-4 py-3 text-left text-sm font-semibold text-white">Start Coding Assessment</button>
              <button onClick={() => navigate('/ai')} className="rounded-xl bg-emerald-600 px-4 py-3 text-left text-sm font-semibold text-white">Generate AI Questions</button>
              <button onClick={() => navigate('/interview')} className="rounded-xl bg-indigo-600 px-4 py-3 text-left text-sm font-semibold text-white">Start Mock Interview</button>
              <button onClick={() => navigate('/growth')} className="rounded-xl bg-sky-600 px-4 py-3 text-left text-sm font-semibold text-white">Open Growth Hub</button>
              {user?.role === 'admin' && <button onClick={() => navigate('/admin')} className="rounded-xl bg-slate-950 px-4 py-3 text-left text-sm font-semibold text-white">Open Admin Dashboard</button>}
              <button onClick={logout} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-700">Logout</button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}
