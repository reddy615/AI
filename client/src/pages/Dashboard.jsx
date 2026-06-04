import React, { useEffect, useMemo, useState, useRef } from 'react'
import api from '../api/api'
import { useDispatch } from 'react-redux'
import { setUser as setAuthUser } from '../store/store'
import StatsCard from '../components/StatsCard'
import PerformanceLineChart from '../components/PerformanceLineChart'
import Skeleton from '../components/Skeleton'

function getResumeName(resumePath) {
  if (!resumePath) return ''
  try {
    const url = new URL(resumePath)
    return url.pathname.split('/').filter(Boolean).pop() || ''
  } catch (e) {
    return String(resumePath).split('/').filter(Boolean).pop() || ''
  }
}

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [resumeMessage, setResumeMessage] = useState('')
  const [resumeError, setResumeError] = useState('')
  const dispatch = useDispatch()
  const fileInputRef = useRef(null)

  const resumeUrl = user?.resumeUrl || user?.resume || ''
  const resumeFileName = user?.resumeFileName || getResumeName(resumeUrl)

  const [analytics, setAnalytics] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])

  async function loadProfile({ silent = false } = {}) {
    if (!silent) setLoading(true)
    try {
      const resp = await api.get('/api/profile')
      const data = resp?.data?.data?.user || resp?.data?.user || resp?.data || resp?.data?.profile || null
      setUser(data)
      dispatch(setAuthUser(data))
      if (data) localStorage.setItem('user', JSON.stringify(data))
      return data
    } catch (err) {
      console.error('Failed to load profile', err)
      return null
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
    loadOverview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadOverview() {
    try {
      const [overviewResp, lbResp] = await Promise.allSettled([
        api.get('/api/analytics/overview'),
        api.get('/api/coding/leaderboard'),
      ])
      if (overviewResp.status === 'fulfilled') setAnalytics(overviewResp.value.data.data?.analytics || overviewResp.value.data.analytics)
      if (lbResp.status === 'fulfilled') setLeaderboard(lbResp.value.data.data?.leaderboard || lbResp.value.data.leaderboard || [])
    } catch (err) {
      console.error('Overview load failed', err)
    }
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    const f = e.dataTransfer?.files?.[0]
    if (f) setResumeFile(f)
  }

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  async function uploadResume(event) {
    if (event && event.preventDefault) event.preventDefault()
    setResumeError('')
    setResumeMessage('')

    const file = resumeFile
    if (!file) {
      setResumeError('Choose a PDF or Word document first.')
      return
    }

    const formData = new FormData()
    formData.append('resume', file)

    setResumeUploading(true)
    setUploadProgress(0)
    try {
      const response = await api.post('/api/profile/resume', formData, {
        headers: { 'Accept': 'application/json' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(pct)
          }
        },
      })

      const payload = response?.data?.data || response?.data || {}
      const uploaded = payload?.resumeUrl || payload?.resume || ''
      if (!uploaded) throw new Error('No resume URL returned')

      // refresh persisted profile and show success
      await loadProfile({ silent: true })
      setResumeMessage('Resume uploaded successfully')
      setResumeFile(null)
      setUploadProgress(100)
    } catch (err) {
      console.error('Upload failed', err)
      setResumeError(err.response?.data?.message || err.message || 'Upload failed')
    } finally {
      setResumeUploading(false)
      setTimeout(() => setUploadProgress(0), 800)
    }
  }

  async function removeResume() {
    setResumeError('')
    setResumeMessage('')
    try {
      await api.delete('/api/profile/resume')
      await loadProfile({ silent: true })
      setResumeMessage('Resume removed')
    } catch (err) {
      console.error('Remove failed', err)
      setResumeError(err.response?.data?.message || 'Remove failed')
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-400">Dashboard</p>
          <h1 className="text-3xl font-bold text-white">Your AI Interview Platform</h1>
          <p className="mt-2 text-sm text-slate-400">Overview of your assessments, interviews, and growth.</p>
        </div>
        <div className="hidden sm:block">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-300">Welcome{user?.name ? `, ${user.name}` : ''}</div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
            <div className="mt-3 flex flex-wrap gap-3">
              <a href="/ai" className="rounded-full px-4 py-2 bg-slate-50 text-slate-800">AI Generator</a>
              <a href="/coding" className="rounded-full px-4 py-2 bg-slate-50 text-slate-800">Coding Lab</a>
              <a href="/interview" className="rounded-full px-4 py-2 bg-slate-50 text-slate-800">Interview</a>
              <a href="/quiz" className="rounded-full px-4 py-2 bg-slate-50 text-slate-800">Aptitude</a>
            </div>
          </div>

          {/* Analytics & Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {analytics ? [
                  { label: 'Quiz Attempts', value: analytics?.summary?.totalQuizAttempts || 0, description: 'Completed assessments' },
                  { label: 'Coding Attempts', value: analytics?.summary?.totalCodingAttempts || 0, description: 'Coding runs' },
                  { label: 'Average Accuracy', value: `${analytics?.summary?.averageAccuracy || 0}%`, description: 'Overall accuracy' },
                  { label: 'Best Coding Score', value: analytics?.summary?.bestCodingScore || 0, description: 'Top score' },
                ].map((c) => <StatsCard key={c.label} {...c} />) : Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
              </div>
            </div>

            <div>
              <PerformanceLineChart data={analytics?.quizScores?.map((item, index) => ({ index: index + 1, score: item.score, accuracy: Math.round((item.correct / Math.max(item.correct + item.wrong + item.skipped, 1)) * 100) })) || []} />
            </div>
          </div>

          {/* Recommendations & Coding */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Recommendations</h3>
              <p className="mt-3 text-sm text-slate-500">Personalized learning recommendations will appear here.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Coding Assessment</h3>
              <p className="mt-3 text-sm text-slate-500">Start a coding assessment to evaluate your skills and add to your profile.</p>
              <div className="mt-4">
                <a href="/coding" className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white">Start Coding</a>
              </div>
            </div>
          </div>

          {/* Interview Actions & Progress */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Interview Actions</h3>
              <p className="mt-3 text-sm text-slate-500">Schedule practice interviews and review feedback.</p>
              <div className="mt-4">
                <a href="/interview" className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Practice Interview</a>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Progress</h3>
              <p className="mt-3 text-sm text-slate-500">Track your progress across quizzes and coding challenges.</p>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="text-sm text-slate-600">Quiz Completion</div>
                  <div className="mt-1 h-2 w-full rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyan-500" style={{ width: `${analytics?.summary?.quizCompletion || 40}%` }} /></div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Coding Progress</div>
                  <div className="mt-1 h-2 w-full rounded-full bg-slate-100"><div className="h-full rounded-full bg-green-500" style={{ width: `${analytics?.summary?.codingProgress || 30}%` }} /></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: compact widgets including Resume */}
        <aside className="space-y-6">
          {/* Resume Card (compact premium UI) */}
          <div id="resume" className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Resume</div>
                <div className="mt-1 text-base font-medium text-white">{resumeFileName || 'No resume uploaded'}</div>
              </div>
              <div className="text-sm text-slate-300">Premium</div>
            </div>

            <div className="mt-3">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={openFilePicker}
                className="group relative overflow-hidden rounded-lg border border-dashed border-slate-500/30 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-4 text-center cursor-pointer"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                />
                <div className="pointer-events-none">
                  <p className="text-sm text-slate-300">Drag & drop or click to choose</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 justify-end">
                {resumeUrl ? (
                  <>
                    <a href={resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white">View</a>
                    <a href={resumeUrl} download={resumeFileName || 'resume'} className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white">Download</a>
                    <button onClick={removeResume} className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white">Remove</button>
                  </>
                ) : (
                  <div className="rounded-md border border-dashed border-white/10 px-3 py-2 text-sm text-slate-400">No resume</div>
                )}
              </div>
            </div>
          </div>

          {/* Leaderboard / Gamification */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-900">Leaderboard</h4>
            <div className="mt-3 space-y-2">
              {leaderboard.length ? leaderboard.slice(0,5).map((l, i) => (
                <div key={l.id || i} className="flex items-center justify-between">
                  <div className="text-sm text-slate-700">#{i+1} {l.challenge || l.user || l.name}</div>
                  <div className="text-sm font-semibold text-slate-900">{l.bestScore || l.score || 0}</div>
                </div>
              )) : <div className="text-sm text-slate-500">No leaderboard data</div>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-900">Recommendations</h4>
            <p className="mt-2 text-sm text-slate-500">Personalized tips will show here.</p>
          </div>
        </aside>
      </section>
    </div>
  )
}
