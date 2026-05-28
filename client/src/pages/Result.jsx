import React, { useEffect, useState } from 'react'
import api from '../api/api'
import { useParams, Link } from 'react-router-dom'

export default function Result(){
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [showAnswers, setShowAnswers] = useState(false)

  useEffect(()=>{
    api.get(`/api/quiz/result/${id}`).then(r=>setData(r.data)).catch(e=>console.error(e))
  },[id])

  if (!data) return <div>Loading result...</div>

  const { attempt, analytics } = data
  const answerList = attempt?.answers || []

  return (
    <div className="max-w-2xl mx-auto bg-white p-4 rounded shadow">
      <h2 className="text-xl font-bold">Result</h2>
      <p className="mt-2">Score: <strong>{attempt.score}</strong></p>
      <p>Correct: {attempt.correctCount} • Wrong: {attempt.wrongCount} • Skipped: {attempt.skippedCount}</p>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowAnswers((current) => !current)}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          {showAnswers ? 'Hide Answers' : 'View Answers'}
        </button>
      </div>

      {showAnswers ? (
        <div className="mt-4 space-y-3">
          <h4 className="font-semibold">Answers</h4>
          {answerList.map((answer, index) => {
            const resolvedQuestion = answer.questionId?.text || answer.questionText || `Question ${index + 1}`
            const selected = answer.selectedAnswer ?? (answer.selectedIndex === null || answer.selectedIndex === undefined ? 'Skipped' : String(answer.selectedIndex + 1))
            const correct = answer.correctAnswer ?? (answer.correctIndex === null || answer.correctIndex === undefined ? 'N/A' : String(answer.correctIndex + 1))

            return (
              <div key={answer.questionId?._id || answer.questionId || index} className="rounded border border-slate-200 p-3">
                <div className="text-sm font-semibold text-slate-900">
                  {index + 1}. {resolvedQuestion}
                </div>
                <div className="mt-1 text-sm text-slate-600">Your answer: {selected}</div>
                <div className="text-sm text-slate-600">Correct answer: {correct}</div>
              </div>
            )
          })}
        </div>
      ) : null}

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
