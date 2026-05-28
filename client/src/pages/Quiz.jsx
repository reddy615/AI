import React, { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../api/api'
import QuestionCard from '../components/QuestionCard'
import Sidebar from '../components/Sidebar'
import Timer from '../components/Timer'
import ProgressBar from '../components/ProgressBar'

export default function Quiz(){
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const module = params.get('module') || 'aptitude'
  const count = params.get('count') || 10
  const difficulty = params.get('difficulty') || ''
  const navigate = useNavigate()

  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [duration, setDuration] = useState(60 * 15) // default 15 min

  const timerRef = useRef()

  useEffect(()=>{
    (async ()=>{
      try{
        const res = await api.get(`/api/quiz/start?module=${module}&count=${count}${difficulty?`&difficulty=${difficulty}`:''}`)
        setQuestions(res.data.questions)
        setLoading(false)
        setIndex(0)
        setAnswers({})
      }catch(err){ console.error(err); setLoading(false) }
    })()
  },[location.search, module, count, difficulty])

  const handleSelect = (qid, optionIndex)=>{
    setAnswers(prev=>({ ...prev, [qid]: optionIndex }))
  }

  const submit = async (auto=false)=>{
    const normalizedAnswers = Object.fromEntries(
      questions.map((question) => [question.id, Object.prototype.hasOwnProperty.call(answers, question.id) ? answers[question.id] : null])
    )
    const payload = { module, difficulty, answers: normalizedAnswers, durationSeconds: duration }
    try{
      const res = await api.post('/api/quiz/submit', payload)
      const refreshToken = JSON.stringify({
        type: 'quiz-submitted',
        module,
        attemptId: res.data?.attemptId,
        timestamp: Date.now(),
      })
      window.localStorage.setItem('ai-dashboard-refresh', refreshToken)
      window.dispatchEvent(new CustomEvent('ai-dashboard-refresh', { detail: JSON.parse(refreshToken) }))
      navigate(`/result/${res.data.attemptId}`)
    }catch(err){ console.error(err); alert('Submit failed') }
  }

  const handleAutoSubmit = ()=>{ submit(true) }

  if (loading) return <div>Loading...</div>
  if (!questions.length) return <div>No questions available</div>

  return (
    <div className="md:flex gap-4">
      <div className="md:w-3/4 bg-white p-4 rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">{module.toUpperCase()} Assessment</h3>
          <div className="flex items-center gap-3">
            <ProgressBar value={Object.keys(answers).length} max={questions.length} />
            <Timer seconds={duration} onTick={setDuration} onEnd={handleAutoSubmit} ref={timerRef} />
          </div>
        </div>
        <QuestionCard
          question={questions[index]}
          onSelect={handleSelect}
          selected={answers[questions[index].id]}
          questionNumber={index + 1}
          totalQuestions={questions.length}
        />
        <div className="flex justify-between mt-4">
          <button className="btn" onClick={()=>setIndex(i=>Math.max(0,i-1))}>Previous</button>
          <div>
            <button className="btn mr-2" onClick={()=>setIndex(i=>Math.min(questions.length-1,i+1))}>Next</button>
            <button className="btn bg-green-600 text-white" onClick={()=>submit(false)}>Submit</button>
          </div>
        </div>
      </div>
      <div className="md:w-1/4 mt-4 md:mt-0">
        <Sidebar questions={questions} answers={answers} onJump={(i)=>setIndex(i)} />
      </div>
    </div>
  )
}
