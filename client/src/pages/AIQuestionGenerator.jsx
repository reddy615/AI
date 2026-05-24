import React, { useEffect, useMemo, useState } from 'react'
import api from '../api/api'
import Skeleton from '../components/Skeleton'

export default function AIQuestionGenerator() {
  const [form, setForm] = useState({ module: 'technical', difficulty: 'medium', count: 5, role: 'Software Engineer', experienceLevel: 'mid', weakAreas: '' })
  const [questions, setQuestions] = useState([])
  const [recentQuestions, setRecentQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadRecent = async () => {
    try {
      const response = await api.get('/api/ai/questions?limit=20')
      setRecentQuestions(response.data.data?.questions || response.data.questions || [])
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    loadRecent()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const generate = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      const response = await api.post('/api/ai/generate', {
        module: form.module,
        difficulty: form.difficulty,
        count: Number(form.count),
        candidateProfile: {
          role: form.role,
          experienceLevel: form.experienceLevel,
          weakAreas: form.weakAreas.split(',').map((item) => item.trim()).filter(Boolean),
        },
      })

      const generated = response.data.data?.questions || response.data.questions || []
      setQuestions(generated)
      await loadRecent()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const copyQuestion = async (question) => {
    try {
      await navigator.clipboard.writeText(question.question || question.prompt)
      setSaving(true)
      setTimeout(() => setSaving(false), 1000)
    } catch (error) {
      console.error(error)
    }
  }

  const visibleQuestions = useMemo(() => questions.length ? questions : recentQuestions.slice(0, 5), [questions, recentQuestions])

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-600">AI Generation</p>
        <h1 className="text-3xl font-bold text-slate-900">Generate Personalized Interview Questions</h1>
        <p className="mt-2 text-sm text-slate-500">Use OpenAI or Gemini when configured, or the secure fallback generator for local development.</p>
      </div>

      <form onSubmit={generate} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Module
          <select name="module" value={form.module} onChange={handleChange} className="rounded-xl border border-slate-300 px-4 py-3">
            <option value="technical">Technical</option>
            <option value="aptitude">Aptitude</option>
            <option value="reasoning">Reasoning</option>
            <option value="verbal">Verbal</option>
            <option value="hr">HR</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Difficulty
          <select name="difficulty" value={form.difficulty} onChange={handleChange} className="rounded-xl border border-slate-300 px-4 py-3">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Count
          <input name="count" type="number" min="1" max="20" value={form.count} onChange={handleChange} className="rounded-xl border border-slate-300 px-4 py-3" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Target Role
          <input name="role" value={form.role} onChange={handleChange} className="rounded-xl border border-slate-300 px-4 py-3" placeholder="Software Engineer" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Experience Level
          <input name="experienceLevel" value={form.experienceLevel} onChange={handleChange} className="rounded-xl border border-slate-300 px-4 py-3" placeholder="mid" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 lg:col-span-2">
          Weak Areas
          <input name="weakAreas" value={form.weakAreas} onChange={handleChange} className="rounded-xl border border-slate-300 px-4 py-3" placeholder="arrays, graphs, time management" />
        </label>
        <div className="lg:col-span-2 flex items-center gap-3">
          <button type="submit" className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
            {loading ? 'Generating...' : 'Generate Questions'}
          </button>
          {saving && <span className="text-sm text-emerald-600">Copied to clipboard</span>}
        </div>
      </form>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Generated Questions</h3>
          <div className="mt-4 space-y-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24" />)
            ) : visibleQuestions.length ? (
              visibleQuestions.map((question) => (
                <div key={question._id || question.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm uppercase tracking-[0.18em] text-slate-500">{question.module} · {question.difficulty}</div>
                  <div className="mt-2 font-semibold text-slate-900">{question.question || question.prompt}</div>
                  <div className="mt-2 text-sm text-slate-600">{question.explanation}</div>
                  <button onClick={() => copyQuestion(question)} className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200">Copy Prompt</button>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">Generate a new set to see AI questions here.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Recent AI Library</h3>
          <div className="mt-4 space-y-3">
            {recentQuestions.length ? recentQuestions.slice(0, 8).map((question) => (
              <div key={question._id} className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <div className="font-semibold text-slate-900">{question.question}</div>
                <div className="mt-1">{question.module} · {question.difficulty} · {question.source}</div>
              </div>
            )) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No generated questions yet.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
