import React, { useEffect, useMemo, useState } from 'react'
import api from '../api/api'
import Skeleton from '../components/Skeleton'
import LoadingOverlay from '../components/LoadingOverlay'
import { useToast } from '../components/ToastProvider'
import { useLanguage } from '../context/LanguageContext'

const tabs = ['overview', 'users', 'questions', 'interviews', 'reports']

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [data, setData] = useState({ summary: null, users: [], questions: [], interviews: [], reports: null, leaderboard: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { t } = useLanguage()
  const toast = useToast()

  const parseBlobError = async (responseData, defaultMessage) => {
    if (!(responseData instanceof Blob)) {
      return defaultMessage
    }

    try {
      const text = await responseData.text()
      const parsed = JSON.parse(text)
      return parsed.message || parsed.error || text || defaultMessage
    } catch {
      return responseData.type ? `${responseData.type} error` : defaultMessage
    }
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [summaryResponse, usersResponse, questionsResponse, interviewsResponse, reportsResponse] = await Promise.allSettled([
        api.get('/api/admin/summary'),
        api.get('/api/admin/users?limit=10'),
        api.get('/api/admin/questions?limit=10'),
        api.get('/api/admin/interviews'),
        api.get('/api/admin/reports'),
      ])

      const nextData = {
        summary: summaryResponse.status === 'fulfilled' ? (summaryResponse.value.data.data?.summary || summaryResponse.value.data.summary || null) : null,
        leaderboard: summaryResponse.status === 'fulfilled' ? (summaryResponse.value.data.data?.leaderboard || summaryResponse.value.data.leaderboard || []) : [],
        users: usersResponse.status === 'fulfilled' ? (usersResponse.value.data.data?.users || usersResponse.value.data.users || []) : [],
        questions: questionsResponse.status === 'fulfilled' ? (questionsResponse.value.data.data?.questions || questionsResponse.value.data.questions || []) : [],
        interviews: interviewsResponse.status === 'fulfilled' ? (interviewsResponse.value.data.data?.sessions || interviewsResponse.value.data.sessions || []) : [],
        reports: reportsResponse.status === 'fulfilled' ? (reportsResponse.value.data.data?.reports || reportsResponse.value.data.reports || null) : null,
      }

      setData(nextData)

      const failures = [summaryResponse, usersResponse, questionsResponse, interviewsResponse, reportsResponse].filter((item) => item.status === 'rejected')
      if (failures.length === 5) {
        setError('No admin data could be loaded.')
        toast.error('Unable to load admin dashboard. Please try again later.')
      }
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to load admin data'
      setError(message)
      toast.error(message)
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
      { label: 'Users', value: data.summary.userCount ?? 0 },
      { label: 'Active', value: data.summary.activeUserCount ?? 0 },
      { label: 'Questions', value: (Number(data.summary.questionCount) || 0) + (Number(data.summary.aiQuestionCount) || 0) },
      { label: 'Sessions', value: data.summary.interviewCount ?? 0 },
      { label: 'Attempts', value: (Number(data.summary.attemptCount) || 0) + (Number(data.summary.codingCount) || 0) },
      { label: 'Avg XP', value: data.summary.averageXp ?? 0 },
    ]
  }, [data.summary])

  const [reminderLoading, setReminderLoading] = useState({})

  const updateUser = async (userId, payload) => {
    try {
      await api.patch(`/api/admin/users/${userId}`, payload)
      toast.success('User settings updated successfully')
      await loadData()
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to update user'
      setError(message)
      toast.error(message)
    }
  }

  const handleSendResumeReminder = async (user) => {
    console.log('USER DATA:', user)
    console.log('RESUME URL:', user.resumeUrl)

    const userId = user?._id || user?.id
    if (!userId) {
      toast.error('User ID not found')
      return
    }

    setReminderLoading((prev) => ({ ...prev, [userId]: true }))
    try {
      await api.post(`/api/admin/users/${userId}/send-resume-reminder`)
      toast.success('Reminder email sent successfully')
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to send reminder email'
      setError(message)
      toast.error(message)
    } finally {
      setReminderLoading((prev) => ({ ...prev, [userId]: false }))
    }
  }

  const handleViewResume = async (user) => {
    const userId = user?._id || user?.id
    if (!userId) {
      toast.error('User ID not found')
      return
    }

    try {
      // Fetch resume file as blob using authenticated admin endpoint
      const response = await api.get(`/api/admin/users/${userId}/resume`, {
        responseType: 'blob',
      })

      // Create blob URL for inline viewing
      const blobUrl = window.URL.createObjectURL(response.data)
      
      // Open in new tab (browser will render PDF inline if possible)
      const newTab = window.open(blobUrl, '_blank', 'noopener,noreferrer')
      if (newTab) {
        newTab.focus()
      }

      // Clean up blob URL after a short delay to ensure the new tab has loaded
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl)
      }, 5000)

      toast.success('Resume opened in new tab')
    } catch (requestError) {
      let message = requestError.message || 'Failed to view resume'
      if (requestError.response) {
        message = await parseBlobError(requestError.response.data, message)
      }
      toast.error(message)
    }
  }

  const handleDownloadResume = async (user) => {
    const userId = user?._id || user?.id
    if (!userId) {
      toast.error('User ID not found')
      return
    }

    try {
      // Fetch resume file as blob using authenticated admin endpoint with download flag
      const response = await api.get(`/api/admin/users/${userId}/resume`, {
        responseType: 'blob',
        params: { download: 'true' },
      })

      // Create blob URL for download
      const blobUrl = window.URL.createObjectURL(response.data)
      
      const disposition = response.headers['content-disposition'] || response.headers['Content-Disposition'] || ''
      const filenameMatch = disposition.match(/filename\*=UTF-8''([^;\n\r]+)/i) || disposition.match(/filename="([^"]+)"/i) || disposition.match(/filename=([^;\n\r]+)/i)
      const filename = (filenameMatch && filenameMatch[1] ? decodeURIComponent(filenameMatch[1]) : user.resumeFileName) || 'resume.pdf'
      
      // Create temporary anchor element to trigger download
      const link = document.createElement('a')
      link.href = blobUrl
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      
      // Clean up after the browser has started processing the download
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(blobUrl)
      }, 5000)

      toast.success('Resume downloaded successfully')
    } catch (requestError) {
      let message = requestError.message || 'Failed to download resume'
      if (requestError.response) {
        message = await parseBlobError(requestError.response.data, message)
      }
      toast.error(message)
    }
  }

  const formatResumeDate = (d) => {
    if (!d) return '-'
    try {
      const date = new Date(d)
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch (e) {
      return String(d)
    }
  }

  const renderOverview = () => (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-28" />)
          : metrics.length ? metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-sm uppercase tracking-[0.18em] text-slate-500">{metric.label}</div>
                <div className="mt-2 text-3xl font-bold text-slate-900">{metric.value}</div>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500 xl:col-span-3">
                No analytics available.
              </div>
            )}
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
            ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  No leaderboard data yet.
                </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Platform Reports</h2>
          <div className="mt-4 space-y-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : data.reports ? (
              Array.isArray(data.reports) ? (
                <div className="overflow-auto rounded-2xl border border-slate-100 bg-white p-2">
                  <table className="min-w-full text-sm">
                    <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
                      <tr>
                        <th className="py-2 px-3 text-left">Type</th>
                        <th className="py-2 px-3 text-left">Source</th>
                        <th className="py-2 px-3 text-left">Date</th>
                        <th className="py-2 px-3 text-left">Status</th>
                        <th className="py-2 px-3 text-left">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.reports.map((r, idx) => (
                        <tr key={r.id || r._id || idx} className="hover:bg-slate-50">
                          <td className="py-3 px-3 text-slate-700">{r.type || r.reportType || 'report'}</td>
                          <td className="py-3 px-3 text-slate-700 truncate max-w-[180px]">{r.source || r.origin || r.userEmail || 'system'}</td>
                          <td className="py-3 px-3 text-slate-700">{formatDate(r.createdAt || r.date)}</td>
                          <td className="py-3 px-3 text-slate-700">{r.status || r.state || 'open'}</td>
                          <td className="py-3 px-3 text-slate-700 truncate max-w-[280px]">{r.summary || r.message || r.note || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.keys(data.reports).length ? Object.entries(data.reports).map(([k, v]) => (
                    <div key={k} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="text-xs text-slate-500">{k}</div>
                      <div className="mt-2 font-semibold text-slate-900">{typeof v === 'number' ? v : (Array.isArray(v) ? v.length : String(v).slice(0, 120))}</div>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                      No reports available.
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                No reports available.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )

  const renderUsers = () => (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">User Management</h2>
          <p className="text-sm text-slate-500">Promote admins, deactivate accounts, view resumes, or switch preference settings.</p>
        </div>
        <button onClick={loadData} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition">Refresh</button>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Language</th>
              <th className="px-4 py-3">XP</th>
              <th className="px-4 py-3">Resume</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {loading ? (
              <tr><td className="px-4 py-4" colSpan="6"><Skeleton className="h-10" /></td></tr>
            ) : data.users.length ? data.users.map((user) => (
              <tr key={user._id || user.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-4">
                  <div className="font-semibold text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </td>
                <td className="px-4 py-4 capitalize text-slate-700">{user.role}</td>
                <td className="px-4 py-4 uppercase text-slate-700">{user.preferredLanguage || 'en'}</td>
                <td className="px-4 py-4 text-slate-700">{user.xp || 0}</td>
                <td className="px-4 py-4">
                  {user.hasResume ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                          ✓ Uploaded
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-[150px]" title={user.resumeFileName}>
                        {user.resumeFileName || 'resume'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {formatResumeDate(user.resumeUploadedAt)}
                      </div>
                    </div>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      Not Uploaded
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {user.resumeUrl ? (
                      <>
                        <button 
                          onClick={() => handleViewResume(user)}
                          title={`View ${user.resumeFileName || 'resume'}`}
                          className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleDownloadResume(user)}
                          title={`Download ${user.resumeFileName || 'resume'}`}
                          className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition"
                        >
                          Download
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleSendResumeReminder(user)}
                        disabled={Boolean(reminderLoading[user._id || user.id])}
                        className="rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 px-3 py-1.5 text-xs font-semibold text-white shadow-lg hover:from-orange-600 hover:via-amber-400 hover:to-orange-500 transition disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {reminderLoading[user._id || user.id] ? 'Sending...' : 'Send Mail'}
                      </button>
                    )}
                    <button 
                      onClick={() => updateUser(user._id || user.id, { role: user.role === 'admin' ? 'user' : 'admin' })} 
                      className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
                    >
                      Toggle Role
                    </button>
                    <button 
                      onClick={() => updateUser(user._id || user.id, { isActive: !user.isActive })} 
                      className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td className="px-4 py-6 text-sm text-slate-500" colSpan="6">
                  No users found.
                </td>
              </tr>
            )}
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
      )) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 lg:col-span-2">
          No questions found.
        </div>
      )}
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
      )) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          No interview reports yet.
        </div>
      )}
    </div>
  )

  const formatDate = (d) => {
    if (!d) return '-'
    try {
      const date = new Date(d)
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    } catch (e) {
      return String(d)
    }
  }

  const renderLeaderboard = () => {
    const list = data.leaderboard || []
    if (!list.length) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          No leaderboard activity yet.
        </div>
      )
    }

    return (
      <div className="overflow-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="py-2 px-3 text-left">Rank</th>
              <th className="py-2 px-3 text-left">Name</th>
              <th className="py-2 px-3 text-left">XP</th>
              <th className="py-2 px-3 text-left">Level</th>
              <th className="py-2 px-3 text-left">Streak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((entry, idx) => (
              <tr key={entry.userId || entry.id || idx} className="hover:bg-slate-50">
                <td className="py-3 px-3 text-slate-700">#{entry.rank || idx + 1}</td>
                <td className="py-3 px-3 font-semibold text-slate-900">{entry.name || entry.username || entry.displayName || 'Unknown'}</td>
                <td className="py-3 px-3 text-slate-700">{entry.xp || 0}</td>
                <td className="py-3 px-3 text-slate-700">{entry.level || entry.levelName || '-'}</td>
                <td className="py-3 px-3 text-slate-700">{entry.streak || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderTopUsers = () => {
    const top = data.users?.slice(0, 10) || []
    if (loading) {
      return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
    }

    if (!top.length) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No users found.</div>
      )
    }

    return (
      <div className="overflow-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="py-2 px-3 text-left">Name</th>
              <th className="py-2 px-3 text-left">Email</th>
              <th className="py-2 px-3 text-left">XP</th>
              <th className="py-2 px-3 text-left">Level</th>
              <th className="py-2 px-3 text-left">Interviews</th>
              <th className="py-2 px-3 text-left">Coding Attempts</th>
              <th className="py-2 px-3 text-left">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {top.map((u) => (
              <tr key={u._id || u.id} className="hover:bg-slate-50">
                <td className="py-3 px-3 font-semibold text-slate-900">{u.name || '—'}</td>
                <td className="py-3 px-3 text-slate-700 truncate max-w-[200px]">{u.email || '—'}</td>
                <td className="py-3 px-3 text-slate-700">{u.xp || 0}</td>
                <td className="py-3 px-3 text-slate-700">{u.level || '-'}</td>
                <td className="py-3 px-3 text-slate-700">{u.interviews || u.interviewCount || 0}</td>
                <td className="py-3 px-3 text-slate-700">{u.codingAttempts || u.codingCount || 0}</td>
                <td className="py-3 px-3 text-slate-700">{formatDate(u.createdAt || u.joinedAt || u.registeredAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderAnalyticsSummary = () => {
    const s = data.summary || {}
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Analytics Summary</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Users</div>
            <div className="text-xl font-bold text-slate-900">{s.userCount ?? '-'}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Active</div>
            <div className="text-xl font-bold text-slate-900">{s.activeUserCount ?? '-'}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Questions</div>
            <div className="text-xl font-bold text-slate-900">{(s.questionCount || 0) + (s.aiQuestionCount || 0)}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Sessions</div>
            <div className="text-xl font-bold text-slate-900">{s.interviewCount ?? '-'}</div>
          </div>
        </div>
      </div>
    )
  }

  const renderReports = () => (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">{renderAnalyticsSummary()}</div>
        <div>{renderLeaderboard()}</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>{renderTopUsers()}</div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">User Statistics</h3>
          <div className="space-y-3 text-sm text-slate-700">
            <div>Average XP: <strong className="text-slate-900">{data.summary?.averageXp ?? '—'}</strong></div>
            <div>Average Attempts: <strong className="text-slate-900">{data.summary?.averageAttempts ?? '—'}</strong></div>
            <div>Retention (30d): <strong className="text-slate-900">{data.summary?.retention30d ?? '—'}</strong></div>
            <div>Active Today: <strong className="text-slate-900">{data.summary?.activeToday ?? '—'}</strong></div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-8 relative">
      <LoadingOverlay
        visible={loading}
        title="Loading admin dashboard"
        subtitle="Gathering platform and user analytics for administrators."
      />
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