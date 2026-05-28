import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/api'
import AptitudeResultSkeleton from '../components/aptitude-result/AptitudeResultSkeleton'
import { AptitudeResultAnalytics } from '../components/aptitude-result/AptitudeResultAnalytics'

export default function Result() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [history, setHistory] = useState([])
  const [gamification, setGamification] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadResult = async () => {
      setLoading(true)
      try {
        const [resultResponse, historyResponse, gamificationResponse] = await Promise.allSettled([
          api.get(`/api/quiz/result/${id}`),
          api.get('/api/quiz/history'),
          api.get('/api/gamification/me'),
        ])

        if (!mounted) return

        if (resultResponse.status === 'fulfilled') {
          setData(resultResponse.value.data)
        }

        if (historyResponse.status === 'fulfilled') {
          const responseData = historyResponse.value.data
          setHistory(responseData.data?.attempts || responseData.attempts || [])
        }

        if (gamificationResponse.status === 'fulfilled') {
          const responseData = gamificationResponse.value.data
          setGamification(responseData.data || responseData)
        }
      } catch (error) {
        console.error(error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadResult()

    return () => {
      mounted = false
    }
  }, [id])

  if (loading) return <AptitudeResultSkeleton />
  if (!data) return <div className="p-6 text-slate-700">Unable to load result.</div>

  const { attempt, analytics } = data

  if (attempt?.module === 'aptitude') {
    return (
      <AptitudeResultAnalytics
        attempt={attempt}
        analytics={analytics}
        history={history}
        gamification={gamification}
        onBack={() => navigate('/dashboard')}
      />
    )
  }

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold">Result</h2>
      <p className="mt-2">Score: <strong>{attempt.score}</strong></p>
      <p>Correct: {attempt.correctCount} • Wrong: {attempt.wrongCount} • Skipped: {attempt.skippedCount}</p>

      <h4 className="mt-4 font-semibold">Topic-wise</h4>
      <div className="mt-2 space-y-2">
        {Object.entries(analytics.byTopic).map(([topic, stats]) => (
          <div key={topic} className="rounded border p-2">
            <div className="font-semibold">{topic}</div>
            <div className="text-sm text-gray-700">Score: {stats.score} • Correct: {stats.correct} • Wrong: {stats.wrong} • Skipped: {stats.skipped}</div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <Link to="/dashboard" className="text-blue-600">Back to dashboard</Link>
      </div>
    </div>
  )
}
