import React from 'react'

export default function Sidebar({ questions, answers, onJump }){
  return (
    <div className="bg-white p-3 rounded shadow">
      <h4 className="font-semibold mb-2">Questions</h4>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, idx)=>{
          const answered = answers[q.id] !== undefined && answers[q.id] !== null
          return (
            <button key={q.id} onClick={()=>onJump(idx)} className={`p-2 rounded ${answered? 'bg-green-100':'bg-gray-100'}`}>
              {idx+1}
            </button>
          )
        })}
      </div>
    </div>
  )
}
