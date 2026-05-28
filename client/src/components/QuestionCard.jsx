import React from 'react'

export default function QuestionCard({ question, onSelect, selected, questionNumber, totalQuestions }){
  if (!question) return null
  return (
    <div>
      <div className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        Question {questionNumber}{totalQuestions ? ` of ${totalQuestions}` : ''}
      </div>
      <div className="text-lg font-semibold mb-3">{question.text}</div>
      <div className="space-y-2">
        {question.options.map((opt, i)=> (
          <label key={i} className={`block p-3 border rounded cursor-pointer ${selected===i? 'border-blue-500 bg-blue-50':''}`}>
            <input type="radio" name={`q-${question.id}`} checked={selected===i} onChange={()=>onSelect(question.id, i)} className="mr-2" />
            {opt.text}
          </label>
        ))}
      </div>
    </div>
  )
}
