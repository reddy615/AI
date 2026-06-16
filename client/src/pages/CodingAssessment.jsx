import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Editor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import api from '../api/api'
import Skeleton from '../components/Skeleton'
import { useToast } from '../components/ToastProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  Play, 
  Send, 
  Timer, 
  Settings, 
  CheckCircle2,
  XCircle,
  Terminal
} from 'lucide-react'

// Force Monaco to load from local bundle files instead of external CDN.
loader.config({ monaco })

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
]

function normalizeLanguage(value) {
  const language = String(value || '').toLowerCase().trim()
  if (!language) return 'javascript'
  if (language === 'c++') return 'cpp'
  return LANGUAGES.some((item) => item.value === language) ? language : 'javascript'
}

function getChallengeDescription(prompt = '') {
  const match = String(prompt).match(/Description:\s*([\s\S]*?)(?:\n\nExamples:|\n\nConstraints:|$)/i)
  return match ? match[1].trim() : String(prompt).trim()
}

export default function CodingAssessment() {
  const [view, setView] = useState('dashboard') // dashboard or workspace
  const [challenges, setChallenges] = useState([])
  const [challenge, setChallenge] = useState(null)
  const [language, setLanguage] = useState('javascript')
  const [sourceCode, setSourceCode] = useState('')
  const [editorTheme, setEditorTheme] = useState('vs-dark')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const toast = useToast()
  const [results, setResults] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])

  // Timer Logic
  useEffect(() => {
    if (view === 'workspace' && timeRemaining > 0) {
      const timer = setInterval(() => setTimeRemaining(prev => prev - 1), 1000)
      return () => clearInterval(timer)
    }
  }, [view, timeRemaining])

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const loadChallenges = useCallback(async () => {
    setLoading(true)
    try {
      const [challengeResponse, leaderboardResponse] = await Promise.all([
        api.get('/api/coding/challenges?limit=12'),
        api.get('/api/coding/leaderboard'),
      ])

      const challengeList = challengeResponse.data.data?.challenges || challengeResponse.data.challenges || []
      const leaderboardList = leaderboardResponse.data.data?.leaderboard || leaderboardResponse.data.leaderboard || []

      setChallenges(challengeList)
      setLeaderboard(leaderboardList)
    } catch (error) {
      toast.error('Failed to load challenges')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadChallenges()
  }, [loadChallenges])

  const startChallenge = async (challengeId) => {
    setLoading(true)
    try {
      const response = await api.get(`/api/coding/challenges/${challengeId}`)
      const selected = response.data.data?.challenge || response.data.challenge
      setChallenge(selected)
      setLanguage(normalizeLanguage(selected?.language))
      setSourceCode(selected?.starterCode || '// Write your solution here\nfunction solve(input) {\n  return input;\n}\n')
      setResults(null)
      setTimeRemaining((selected.timeLimitMinutes || 30) * 60)
      setView('workspace')
    } catch (error) {
      toast.error('Failed to load challenge details')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (isSubmission = false) => {
    setSubmitting(true)
    try {
      const response = await api.post('/api/coding/run', {
        challengeId: challenge._id,
        language,
        sourceCode,
      })
      const payload = response.data.data || response.data
      setResults(payload)
      setConsoleOpen(true)
      if (isSubmission) {
        toast.success(`Submission ${payload.status.toUpperCase()}! Score: ${payload.score}`)
      }
    } catch (error) {
      toast.error('Execution failed. Check your internet connection.')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredChallenges = challenges.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchDiff = filterDifficulty === 'all' || c.difficulty === filterDifficulty
    return matchSearch && matchDiff
  })

  const renderDashboard = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Challenges</h1>
          <p className="text-slate-500 mt-1">Master your coding skills with curated problems.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search problems..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-900/5 transition"
            />
          </div>
          <select 
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white outline-none"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredChallenges.map(c => (
          <button
            key={c._id}
            onClick={() => startChallenge(c._id)}
            className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-2xl hover:border-slate-900 transition-all group"
          >
            <div className="flex items-center gap-6">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                <Terminal className="h-5 w-5 text-slate-400 group-hover:text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-slate-900">{c.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                  <span className={`capitalize font-semibold ${
                    c.difficulty === 'easy' ? 'text-emerald-500' : 
                    c.difficulty === 'medium' ? 'text-amber-500' : 'text-rose-500'
                  }`}>{c.difficulty}</span>
                  <span>•</span>
                  <span>{c.language}</span>
                  <span>•</span>
                  <div className="flex gap-1">
                    {c.tags?.slice(0, 2).map(t => (
                      <span key={t} className="bg-slate-100 px-2 py-0.5 rounded text-[10px] uppercase font-bold">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-slate-900">82%</div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Acceptance</div>
              </div>
              <div className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-slate-900 group-hover:border-slate-900 transition-all">
                <ChevronLeft className="h-4 w-4 rotate-180 text-slate-400 group-hover:text-white" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  )

  const [activeTab, setActiveTab] = useState('description') // description, submissions, solution
  const [consoleOpen, setConsoleOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('all')
  const renderWorkspace = () => (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white overflow-hidden">
      {/* Workspace Header */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 shrink-0 bg-[#252526]">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('dashboard')} className="p-2 hover:bg-white/10 rounded-lg transition">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="h-6 w-[1px] bg-white/10" />
          <h2 className="font-bold text-sm truncate max-w-[200px]">{challenge?.title}</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
            <Timer className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold">{formatTime(timeRemaining)}</span>
          </div>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-[#2d2d2d] border border-white/10 text-xs px-3 py-1.5 rounded-lg outline-none"
          >
            {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <button onClick={() => setEditorTheme(t => t === 'vs-dark' ? 'light' : 'vs-dark')} className="p-2 hover:bg-white/10 rounded-lg">
            <Settings className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button 
            disabled={submitting} 
            onClick={() => handleSubmit(false)}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-lg text-sm font-bold transition disabled:opacity-50"
          >
            <Play className="h-4 w-4" /> Run
          </button>
          <button 
            disabled={submitting} 
            onClick={() => handleSubmit(true)}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 px-4 py-1.5 rounded-lg text-sm font-bold transition disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> Submit
          </button>
        </div>
      </header>

      {/* Main Workspace Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Description */}
        <div className="w-1/2 flex flex-col border-r border-white/10 bg-[#1e1e1e]">
          <div className="flex border-b border-white/10 shrink-0">
            {['description', 'submissions', 'solution'].map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all relative ${
                  activeTab === t ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t}
                {activeTab === t && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {activeTab === 'description' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    challenge.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {challenge.difficulty}
                  </span>
                  <div className="h-1 w-1 rounded-full bg-white/20" />
                  <div className="flex gap-2">
                    {challenge.tags?.map(t => <span key={t} className="text-[10px] text-slate-500 font-bold uppercase">#{t}</span>)}
                  </div>
                </div>
                <h1 className="text-2xl font-bold">{challenge.title}</h1>
                <div className="prose prose-invert text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {getChallengeDescription(challenge.prompt)}
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-widest">Example 1</h4>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-sm">
                    <div className="text-slate-500 mb-1">Input:</div>
                    <div>{challenge.sampleInput}</div>
                    <div className="text-slate-500 mt-3 mb-1">Output:</div>
                    <div>{challenge.sampleOutput}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-widest">Constraints</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-slate-400">
                    {challenge.constraints?.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Editor + Console */}
        <div className="w-1/2 flex flex-col relative">
          <div className="flex-1 bg-[#1e1e1e]">
            <Editor
              height="100%"
              language={language === 'c' ? 'cpp' : language}
              theme={editorTheme}
              value={sourceCode}
              onChange={(val) => setSourceCode(val)}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                readOnly: false,
                automaticLayout: true,
                padding: { top: 20 }
              }}
            />
          </div>

          {/* Console Drawer */}
          <motion.div 
            animate={{ height: consoleOpen ? '35%' : '44px' }}
            className="bg-[#1e1e1e] border-t border-white/10 flex flex-col overflow-hidden"
          >
            <button 
              onClick={() => setConsoleOpen(!consoleOpen)}
              className="h-11 flex items-center justify-between px-4 shrink-0 hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <Terminal className="h-4 w-4" /> Console
              </div>
              <div className={`h-2 w-2 rounded-full ${submitting ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            </button>

            <div className="flex-1 overflow-y-auto p-6 bg-[#1a1a1a]">
              {results ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className={`text-xl font-bold flex items-center gap-2 ${
                      results.status === 'accepted' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {results.status === 'accepted' ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                      {results.status.toUpperCase()}
                    </div>
                    <div className="flex gap-4 text-xs font-mono text-slate-500">
                      <span>Runtime: {results.runtimeMs}ms</span>
                      <span>Memory: {results.memoryKb || 0}KB</span>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {results.testResults?.map((r, i) => (
                      <div key={i} className={`p-4 rounded-xl border ${r.passed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                        <div className="flex justify-between text-xs font-bold mb-3">
                          <span className={r.passed ? 'text-emerald-400' : 'text-rose-400'}>Case {i + 1}</span>
                          <span className="text-slate-500 font-mono uppercase tracking-widest">{r.passed ? 'Passed' : 'Failed'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                          <div>
                            <div className="text-slate-600 mb-1 uppercase text-[10px]">Input</div>
                            <div className="bg-black/20 p-2 rounded truncate">{r.input}</div>
                          </div>
                          <div>
                            <div className="text-slate-600 mb-1 uppercase text-[10px]">Output</div>
                            <div className="bg-black/20 p-2 rounded truncate">{r.actualOutput}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
                  <Terminal className="h-8 w-8 opacity-20" />
                  <span className="text-sm font-medium">Run your code to see results here.</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {loading && (
        <LoadingOverlay 
          visible={true} 
          title={submitting ? 'Executing Solution' : 'Syncing Lab'} 
          subtitle="This may take a few moments."
        />
      )}
      {view === 'dashboard' ? renderDashboard() : renderWorkspace()}
    </div>
  )
}
