import React from 'react'

export default function SkillMatrix({ data = {} }) {
  const skills = Object.keys(data).length ? Object.keys(data) : ['JavaScript','React','Node','Python','SQL']

  return (
    <div className="overflow-auto">
      <table className="w-full table-auto text-sm">
        <thead>
          <tr className="text-left text-slate-400">
            <th className="pb-2">Skill</th>
            <th className="pb-2">Match</th>
            <th className="pb-2">Frequency</th>
          </tr>
        </thead>
        <tbody>
          {skills.map((k, idx) => {
            const v = data[k]?.score || data[k] || Math.floor(Math.random()*80)+10
            const freq = data[k]?.count || Math.floor(Math.random()*20)+1
            return (
              <tr key={idx} className="border-t border-slate-700/40">
                <td className="py-3 text-slate-200">{k}</td>
                <td className="py-3"><div className="h-2 bg-slate-800 rounded overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-500 to-pink-500" style={{ width: `${v}%` }} /></div></td>
                <td className="py-3 text-slate-400">{freq}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
