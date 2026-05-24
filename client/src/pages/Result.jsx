import React, { useEffect, useState } from 'react'
import api from '../api/api'
import { useParams, Link } from 'react-router-dom'

export default function Result(){
  const { id } = useParams()
  const [data, setData] = useState(null)

  useEffect(()=>{
    api.get(`/api/quiz/result/${id}`).then(r=>setData(r.data)).catch(e=>console.error(e))
  },[id])

  if (!data) return <div>Loading result...</div>

  const { attempt, analytics } = data

  return (
    <div className="max-w-2xl mx-auto bg-white p-4 rounded shadow">
      <h2 className="text-xl font-bold">Result</h2>
      <p className="mt-2">Score: <strong>{attempt.score}</strong></p>
      <p>Correct: {attempt.correctCount} • Wrong: {attempt.wrongCount} • Skipped: {attempt.skippedCount}</p>
      <h4 className="mt-4 font-semibold">Topic-wise</h4>
      <div className="mt-2 space-y-2">
        {Object.entries(analytics.byTopic).map(([topic, stats])=> (
          <div key={topic} className="p-2 border rounded">
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
