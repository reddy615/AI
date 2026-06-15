import React from 'react'
import { Code2, Calculator, Lightbulb, BrainCircuit, Award, Sparkles } from 'lucide-react'

export default function QuestionCard({ question, onSelect, selected, questionNumber, totalQuestions }){
  if (!question) return null

  const getCategoryDetails = (rawCat) => {
    const cat = String(rawCat || question.topic || 'General').trim();
    if (/coding/i.test(cat)) return { label: 'Coding Questions', icon: Code2, tone: 'from-pink-500/20 to-rose-500/10 text-rose-300 border-rose-500/30' };
    if (/verbal/i.test(cat)) return { label: 'Verbal Ability', icon: Lightbulb, tone: 'from-amber-500/20 to-orange-500/10 text-amber-300 border-amber-500/30' };
    if (/reasoning/i.test(cat)) return { label: 'Logical Reasoning', icon: BrainCircuit, tone: 'from-sky-500/20 to-blue-500/10 text-sky-300 border-sky-500/30' };
    if (/advanced/i.test(cat)) return { label: 'Advanced Aptitude', icon: Award, tone: 'from-violet-500/20 to-fuchsia-500/10 text-violet-300 border-violet-500/30' };
    if (/aptitude/i.test(cat)) return { label: 'Aptitude', icon: Calculator, tone: 'from-emerald-500/20 to-teal-500/10 text-emerald-300 border-emerald-500/30' };
    return { label: cat, icon: Sparkles, tone: 'from-slate-500/20 to-slate-600/10 text-slate-300 border-slate-500/30' };
  };

  const catDetails = getCategoryDetails(question.category);
  const IconComponent = catDetails.icon;
  const isCoding = !question.options || question.options.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400">
          Question {questionNumber} of {totalQuestions}
        </div>
        <div className={`inline-flex items-center gap-2 rounded-full border bg-gradient-to-br ${catDetails.tone} px-3 py-1.5 text-xs font-semibold shadow-md`}>
          <IconComponent className="h-4 w-4" />
          <span>{catDetails.label}</span>
        </div>
      </div>

      <div className="text-lg font-semibold text-white leading-relaxed whitespace-pre-wrap">
        {question.text}
      </div>

      {isCoding ? (
        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400">
            Write your program solution below:
          </label>
          <textarea
            value={selected || ''}
            onChange={(e) => onSelect(question.id, e.target.value)}
            className="w-full h-80 rounded-xl border border-white/10 bg-slate-950 p-4 font-mono text-sm text-cyan-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none placeholder-slate-600 transition shadow-inner"
            placeholder={`// Enter your solution program here. E.g.
function checkPrime(n) {
  // Your code here
}`}
          />
        </div>
      ) : (
        <div className="space-y-2.5">
          {question.options.map((opt, i) => {
            const isSelected = selected === i;
            return (
              <label
                key={i}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition duration-150 ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-400/10 text-white shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                    : 'border-white/10 bg-slate-900/40 text-slate-300 hover:bg-slate-800/40 hover:border-white/20'
                }`}
              >
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  checked={isSelected}
                  onChange={() => onSelect(question.id, i)}
                  className="mt-1 h-4 w-4 accent-cyan-400 focus:ring-cyan-500 bg-slate-950 border-white/20 cursor-pointer"
                />
                <span className="text-sm font-medium">{opt.text}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  )
}
