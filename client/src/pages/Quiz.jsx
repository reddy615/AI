import React, { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../api/api'
import QuestionCard from '../components/QuestionCard'
import Sidebar from '../components/Sidebar'
import Timer from '../components/Timer'
import ProgressBar from '../components/ProgressBar'
import { Clock, ChevronLeft, ChevronRight, Send, HelpCircle, Loader2 } from 'lucide-react'

export default function Quiz(){
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const module = params.get('module') || 'aptitude'
  const count = params.get('count') || 10
  const difficulty = params.get('difficulty') || ''
  const category = params.get('category') || ''
  const assessmentId = params.get('assessmentId') || ''
  const navigate = useNavigate()

  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [duration, setDuration] = useState(60 * 15) // remaining seconds
  const [assessmentTitle, setAssessmentTitle] = useState('')
  const totalDuration = 60 * 15

  const timerRef = useRef()

  useEffect(()=>{
    (async ()=>{
      try{
        const url = assessmentId 
          ? `/api/quiz/start?assessmentId=${assessmentId}`
          : `/api/quiz/start?module=${module}&count=${count}${difficulty?`&difficulty=${difficulty}`:''}${category?`&category=${encodeURIComponent(category)}`:''}`
        const res = await api.get(url)
        const data = res.data?.data || res.data;
        setQuestions(data.questions || [])
        setAssessmentTitle(data.title || '')
        setLoading(false)
        setIndex(0)
        setAnswers({})
      }catch(err){ console.error(err); setLoading(false) }
    })()
  },[location.search, module, count, difficulty, category, assessmentId])

  const handleSelect = (qid, answerValue)=>{
    setAnswers(prev=>({ ...prev, [qid]: answerValue }))
  }

  const submit = async (auto=false)=>{
    const elapsedSeconds = Math.max(totalDuration - duration, 0)
    const normalizedAnswers = Object.fromEntries(
      questions.map((question) => [
        question.id, 
        Object.prototype.hasOwnProperty.call(answers, question.id) ? answers[question.id] : null
      ])
    )
    const payload = { 
      assessmentId: assessmentId || undefined, 
      module, 
      difficulty, 
      category, 
      answers: normalizedAnswers, 
      durationSeconds: elapsedSeconds, 
      remainingSeconds: duration, 
      totalDurationSeconds: totalDuration 
    }
    try{
      const res = await api.post('/api/quiz/submit', payload)
      const data = res.data?.data || res.data;
      navigate(`/result/${data.attemptId}`)
    }catch(err){ console.error(err); alert('Submit failed') }
  }

  const handleAutoSubmit = ()=>{ submit(true) }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
        <p className="mt-4 text-sm font-semibold tracking-wider text-slate-400 uppercase">Preparing your assessment...</p>
      </div>
    )
  }

  if (!questions.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white px-4">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-center max-w-md backdrop-blur-xl">
          <HelpCircle className="mx-auto h-12 w-12 text-slate-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">No Questions Available</h3>
          <p className="text-sm text-slate-400 mb-6">There are no questions configured in this assessment package. Please contact your administrator.</p>
          <button onClick={() => navigate('/dashboard')} className="w-full rounded-xl bg-cyan-500 py-3 text-slate-950 font-bold hover:bg-cyan-400 transition">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const displayTitle = assessmentTitle || `${module.charAt(0).toUpperCase() + module.slice(1)} Assessment`

  return (
    <div className="relative isolate min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* Background glow effects */}
      <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-start">
          
          {/* Main Question Card Area */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-semibold">Active Session</p>
                <h1 className="text-2xl font-black text-white mt-1">{displayTitle}</h1>
              </div>
              <div className="flex items-center gap-4 bg-slate-900/80 border border-white/10 rounded-2xl p-3 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Progress</span>
                  <ProgressBar value={Object.keys(answers).length} max={questions.length} />
                </div>
                <div className="h-8 w-[1px] bg-white/10" />
                <div className="flex items-center gap-2 text-cyan-300">
                  <Clock className="h-4 w-4" />
                  <Timer seconds={duration} onTick={setDuration} onEnd={handleAutoSubmit} ref={timerRef} />
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/60 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <QuestionCard
                question={questions[index]}
                onSelect={handleSelect}
                selected={answers[questions[index].id]}
                questionNumber={index + 1}
                totalQuestions={questions.length}
              />
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center pt-2">
              <button 
                onClick={()=>setIndex(i=>Math.max(0,i-1))}
                disabled={index === 0}
                className="flex items-center gap-2 border border-white/10 hover:bg-white/5 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-xl px-5 py-2.5 transition font-semibold"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-3">
                <button 
                  onClick={()=>setIndex(i=>Math.min(questions.length-1,i+1))}
                  disabled={index === questions.length - 1}
                  className="flex items-center gap-2 border border-white/10 hover:bg-white/5 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-xl px-5 py-2.5 transition font-semibold"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button 
                  onClick={()=>submit(false)}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl px-6 py-2.5 transition shadow-lg shadow-emerald-500/20 hover:scale-[1.01]"
                >
                  <Send className="h-4 w-4" />
                  <span>Submit Test</span>
                </button>
              </div>
            </div>
          </div>

          {/* Grouped Questions Navigation Sidebar */}
          <div className="lg:sticky lg:top-8">
            <Sidebar 
              questions={questions} 
              answers={answers} 
              onJump={(i)=>setIndex(i)} 
              currentIndex={index}
            />
          </div>

        </div>
      </div>
    </div>
  )
}
