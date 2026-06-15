import React from 'react'

export default function Sidebar({ questions, answers, onJump, currentIndex }){
  const getQuestionSection = (q) => {
    const rawCat = q.category || q.topic || 'General';
    if (/coding/i.test(rawCat)) return 'Coding';
    if (/verbal/i.test(rawCat)) return 'Verbal Ability';
    if (/reasoning/i.test(rawCat)) return 'Reasoning';
    if (/advanced/i.test(rawCat)) return 'Advanced Aptitude';
    if (/aptitude/i.test(rawCat)) return 'Aptitude';
    return rawCat;
  };

  const sections = ['Coding', 'Aptitude', 'Verbal Ability', 'Reasoning', 'Advanced Aptitude', 'General'];
  const activeSections = sections.filter(sec => 
    questions.some(q => getQuestionSection(q) === sec)
  );

  const sectionsToUse = activeSections.length > 0 
    ? activeSections 
    : [...new Set(questions.map(q => q.topic || q.category || 'General'))];

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-5 shadow-xl backdrop-blur-xl text-white">
      <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400 mb-4">Assessment Index</h4>
      <div className="space-y-6">
        {sectionsToUse.map(secName => {
          const secQuestions = questions
            .map((q, idx) => ({ q, idx }))
            .filter(item => (activeSections.length > 0 ? getQuestionSection(item.q) : (item.q.topic || item.q.category || 'General')) === secName);
          
          if (secQuestions.length === 0) return null;

          return (
            <div key={secName} className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-1">
                {secName} Section
              </div>
              <div className="grid grid-cols-5 gap-2">
                {secQuestions.map(({ q, idx }) => {
                  const answered = answers[q.id] !== undefined && answers[q.id] !== null;
                  const isCurrent = idx === currentIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => onJump(idx)}
                      className={`h-9 w-9 text-xs rounded-xl font-bold transition duration-200 flex items-center justify-center border ${
                        isCurrent
                          ? 'bg-cyan-400 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                          : answered
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                          : 'bg-slate-800/60 text-slate-300 border-white/5 hover:bg-slate-700/60'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
