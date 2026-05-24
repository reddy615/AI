import React, { useEffect, useMemo, useState } from 'react'
import api from '../api/api'
import Skeleton from '../components/Skeleton'
import { useLanguage } from '../context/LanguageContext'

const tabs = ['overview', 'users', 'questions', 'interviews', 'reports']

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [data, setData] = useState({ summary: null, users: [], questions: [], interviews: [], reports: null, leaderboard: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { t } = useLanguage()

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [summaryResponse, usersResponse, questionsResponse, interviewsResponse, reportsResponse] = await Promise.all([
        api.get('/api/admin/summary'),
        api.get('/api/admin/users?limit=10'),
        api.get('/api/admin/questions?limit=10'),
        api.get('/api/admin/interviews'),
        api.get('/api/admin/reports'),
      ])

      setData({
        summary: summaryResponse.data.data?.summary || summaryResponse.data.summary,
        leaderboard: summaryResponse.data.data?.leaderboard || [],
        users: usersResponse.data.data?.users || usersResponse.data.users || [],
        questions: questionsResponse.data.data?.questions || questionsResponse.data.questions || [],
        interviews: interviewsResponse.data.data?.sessions || interviewsResponse.data.sessions || [],
        reports: reportsResponse.data.data?.reports || reportsResponse.data.reports,
      })
    } catch (requestError) {
      console.error(requestError)
      setError(requestError.response?.data?.message || 'Unable to load admin data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const metrics = useMemo(() => {
    if (!data.summary) return []
    return [
      { label: 'Users', value: data.summary.userCount },
      { label: 'Active', value: data.summary.activeUserCount },
      { label: 'Questions', value: data.summary.questionCount + data.summary.aiQuestionCount },
      { label: 'Sessions', value: data.summary.interviewCount },
      { label: 'Attempts', value: data.summary.attemptCount + data.summary.codingCount },
      { label: 'Avg XP', value: data.summary.averageXp },
    ]
  }, [data.summary])

  const updateUser = async (userId, payload) => {
    try {
      await api.patch(`/api/admin/users/${userId}`, payload)
      await loadData()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update user')
    }
  }

  const renderOverview = () => (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-28" />)
          : metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-sm uppercase tracking-[0.18em] text-slate-500">{metric.label}</div>
                <div className="mt-2 text-3xl font-bold text-slate-900">{metric.value}</div>
              </div>
            ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Top Users</h2>
          <div className="mt-4 space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-16" />)
            ) : data.leaderboard.length ? (
              data.leaderboard.map((entry) => (
                <div key={entry.userId} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <div>
                    <div className="font-semibold text-slate-900">#{entry.rank} {entry.name}</div>
                    <div className="text-sm text-slate-500">Level {entry.level} · {entry.preferredLanguage}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{entry.xp} XP</div>
                    <div className="text-xs text-slate-500">Streak {entry.streak}</div>
                  </div>
                </div>
              ))
            ) : null}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Platform Reports</h2>
          <pre className="mt-4 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
            {JSON.stringify(data.reports, null, 2)}
          </pre>
        </div>
      </section>
    </div>
  )

  const renderUsers = () => (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">User Management</h2>
          <p className="text-sm text-slate-500">Promote admins, deactivate accounts, or switch preference settings.</p>
        </div>
        <button onClick={loadData} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Refresh</button>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Language</th>
              <th className="px-4 py-3">XP</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {loading ? (
              <tr><td className="px-4 py-4" colSpan="5"><Skeleton className="h-10" /></td></tr>
            ) : data.users.length ? data.users.map((user) => (
              <tr key={user._id || user.id}>
                <td className="px-4 py-4">
                  <div className="font-semibold text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </td>
                <td className="px-4 py-4 capitalize text-slate-700">{user.role}</td>
                <td className="px-4 py-4 uppercase text-slate-700">{user.preferredLanguage || 'en'}</td>
                <td className="px-4 py-4 text-slate-700">{user.xp || 0}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => updateUser(user._id || user.id, { role: user.role === 'admin' ? 'user' : 'admin' })} className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
                      Toggle Role
                    </button>
                    <button onClick={() => updateUser(user._id || user.id, { isActive: !user.isActive })} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            )) : null}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderQuestions = () => (
    <div className="grid gap-4 lg:grid-cols-2">
      {loading ? (
        Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32" />)
      ) : data.questions.length ? data.questions.map((question) => (
        <article key={question._id || question.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{question.module || question.category || 'content'}</div>
          <h3 className="mt-2 font-semibold text-slate-900">{question.title || question.question || question.text}</h3>
          <p className="mt-2 text-sm text-slate-600">{question.prompt || question.explanation || 'Managed content item'}</p>
        </article>
      )) : null}
    </div>
  )

  const renderInterviews = () => (
    <div className="space-y-4">
      {loading ? (
        Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24" />)
      ) : data.interviews.length ? data.interviews.map((session) => (
        <div key={session._id || session.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-900">{session.role}</div>
              <div className="text-sm text-slate-500">{session.interviewType} · {session.status}</div>
            </div>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{session.durationSeconds || 0}s</span>
          </div>
        </div>
      )) : null}
    </div>
  )

  const renderReports = () => (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <pre className="overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
        {JSON.stringify(data.reports, null, 2)}
      </pre>
    </div>
  )

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#020617_0%,#0f172a_55%,#1f2937_100%)] px-6 py-8 text-white shadow-2xl sm:px-8 lg:px-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.28em] text-sky-300">Stage 4 Admin</p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{t('admin.title')}</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">{t('admin.subtitle')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === tab ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'users' && renderUsers()}
      {activeTab === 'questions' && renderQuestions()}
      {activeTab === 'interviews' && renderInterviews()}
      {activeTab === 'reports' && renderReports()}
    </div>
  )
}