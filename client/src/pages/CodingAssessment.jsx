import React, { useEffect, useMemo, useState } from 'react'
import Editor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import api from '../api/api'
import Skeleton from '../components/Skeleton'
import LoadingOverlay from '../components/LoadingOverlay'
import { useToast } from '../components/ToastProvider'

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
  const [challenges, setChallenges] = useState([])
  const [selectedChallengeId, setSelectedChallengeId] = useState(null)
  const [challenge, setChallenge] = useState(null)
  const [language, setLanguage] = useState('javascript')
  const [sourceCode, setSourceCode] = useState('// Write your solution here\nfunction solve(input) {\n  return input;\n}\n')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const [submission, setSubmission] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [editorReady, setEditorReady] = useState(false)
  const [editorTimedOut, setEditorTimedOut] = useState(false)
  const [runError, setRunError] = useState('')

  const loadChallenges = async () => {
    setLoading(true)
    console.log('[coding] frontend loadChallenges:start')
    try {
      const [challengeResponse, leaderboardResponse] = await Promise.all([
        api.get('/api/coding/challenges?limit=12'),
        api.get('/api/coding/leaderboard'),
      ])

      const challengeList = challengeResponse.data.data?.challenges || challengeResponse.data.challenges || []
      const leaderboardList = leaderboardResponse.data.data?.leaderboard || leaderboardResponse.data.leaderboard || []

      console.log('[coding] frontend challenge API response', {
        challengeCount: challengeList.length,
        leaderboardCount: leaderboardList.length,
        firstChallengeId: challengeList[0]?._id || null,
      })

      setChallenges(challengeList)
      setLeaderboard(leaderboardList)
    } catch (error) {
      console.error(error)
      toast.error('Unable to load challenges. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChallenges()
  }, [])

  useEffect(() => {
    console.log('[coding] frontend challenges state', {
      loading,
      count: challenges.length,
      firstChallengeId: challenges[0]?._id || null,
    })
  }, [loading, challenges])

  useEffect(() => {
    if (!challenges.length) {
      setChallenge(null)
      setSelectedChallengeId(null)
      console.log('[coding] frontend selectedChallenge state', { selectedChallengeId: null, challengeId: null })
      return
    }

    const selected = selectedChallengeId ? challenges.find((item) => item._id === selectedChallengeId) : null
    const challengeToUse = selected || challenges[0]

    if (challengeToUse) {
      if (challengeToUse._id !== selectedChallengeId) {
        setSelectedChallengeId(challengeToUse._id)
      }

      if (!challenge || challenge._id !== challengeToUse._id) {
        setChallenge(challengeToUse)
        setLanguage(normalizeLanguage(challengeToUse.language))
        setSourceCode(challengeToUse.starterCode || '// Write your solution here\nfunction solve(input) {\n  return input;\n}\n')
        setSubmission(null)
        setRunError('')
      }

      console.log('[coding] frontend selectedChallenge state', {
        selectedChallengeId: challengeToUse._id,
        challengeId: challengeToUse._id,
        title: challengeToUse.title,
      })
    }
  }, [challenge, challenges, selectedChallengeId])

  useEffect(() => {
    if (editorReady) {
      setEditorTimedOut(false)
      return
    }

    const timeout = window.setTimeout(() => {
      setEditorTimedOut(true)
    }, 8000)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [editorReady])

  const startChallenge = async (challengeId) => {
    setSelectedChallengeId(challengeId)
    console.log('[coding] frontend startChallenge', { challengeId })
    try {
      const response = await api.get(`/api/coding/challenges/${challengeId}`)
      const selected = response.data.data?.challenge || response.data.challenge
      console.log('[coding] frontend challenge API response (single)', {
        challengeId: selected?._id || null,
        title: selected?.title || null,
      })
      setChallenge(selected)
      setLanguage(normalizeLanguage(selected?.language))
      setSourceCode(selected?.starterCode || '// Write your solution here\nfunction solve(input) {\n  return input;\n}\n')
      setSubmission(null)
      setRunError('')
    } catch (error) {
      console.error(error)
    }
  }

  const runCode = async () => {
    console.log('[coding] frontend runCode:start', {
      selectedChallengeId,
      challengeId: challenge?._id || null,
      language,
      sourceLength: sourceCode.length,
    })
    if (!challenge) {
      setRunError('Please select a challenge before running your code.')
      return
    }
    if (!sourceCode.trim()) {
      setRunError('Source code cannot be empty.')
      return
    }

    setRunError('')
    setSubmitting(true)
    try {
      const response = await api.post('/api/coding/run', {
        challengeId: challenge._id,
        language,
        sourceCode,
      })
      const payload = response.data.data || response.data
      setSubmission(payload)
      console.log('[coding] frontend runCode:success', {
        status: payload.status,
        score: payload.score,
        runtimeMs: payload.runtimeMs,
      })
      const leaderboardResponse = await api.get('/api/coding/leaderboard')
      setLeaderboard(leaderboardResponse.data.data?.leaderboard || leaderboardResponse.data.leaderboard || [])
    } catch (error) {
      console.error(error)
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Unable to run code right now.'
      toast.error(message)
      setRunError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedTags = useMemo(() => challenge?.tags || [], [challenge])
  const editorLanguage = useMemo(() => (language === 'c' ? 'cpp' : language), [language])
  const challengeDescription = useMemo(() => getChallengeDescription(challenge?.prompt), [challenge])

  useEffect(() => {
    console.log('[coding] frontend selectedChallenge state', {
      selectedChallengeId,
      challengeId: challenge?._id || null,
      challengeTitle: challenge?.title || null,
    })
  }, [selectedChallengeId, challenge])

  return (
    <div className="space-y-8 relative">
      <LoadingOverlay
        visible={loading || submitting}
        title={submitting ? 'Running Code' : 'Loading Coding Lab'}
        subtitle={submitting ? 'Executing your solution and updating the leaderboard.' : 'Preparing the coding assessment environment.'}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-violet-600">Coding Lab</p>
          <h1 className="text-3xl font-bold text-slate-900">Monaco-Based Coding Assessment</h1>
          <p className="mt-2 text-sm text-slate-500">Run code, evaluate test cases, and track results on the leaderboard.</p>
        </div>
        <button onClick={loadChallenges} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700">Refresh Challenges</button>
      </div>

      <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Challenges</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{challenges.length} loaded</span>
          </div>
          <div className="mt-4 space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-20" />)
            ) : challenges.length ? (
              challenges.map((item) => (
                <button
                  key={item._id}
                  onClick={() => startChallenge(item._id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${selectedChallengeId === item._id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`}
                >
                  <div className="text-xs uppercase tracking-[0.18em] opacity-70">{item.language} · {item.difficulty}</div>
                  <div className="mt-1 font-semibold">{item.title}</div>
                  <div className="mt-2 text-xs opacity-75">{item.timeLimitMinutes} min</div>
                </button>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">Add coding challenges to start using the lab.</div>
            )}
          </div>
        </aside>

        <main className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {challenge ? (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm uppercase tracking-[0.18em] text-slate-500">{challenge.language} · {challenge.difficulty}</div>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">{challenge.title}</h2>
                    <p className="mt-3 text-sm text-slate-600 whitespace-pre-wrap">{challengeDescription}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-4"><div className="text-xs uppercase text-slate-500">Time Limit</div><div className="mt-1 text-lg font-semibold text-slate-900">{challenge.timeLimitMinutes} min</div></div>
                  <div className="rounded-xl bg-slate-50 p-4"><div className="text-xs uppercase text-slate-500">Expected Complexity</div><div className="mt-1 text-lg font-semibold text-slate-900">{challenge.expectedComplexity || 'n/a'}</div></div>
                  <div className="rounded-xl bg-slate-50 p-4"><div className="text-xs uppercase text-slate-500">Sample Input</div><div className="mt-1 text-sm font-mono text-slate-700">{challenge.sampleInput || '-'}</div></div>
                  <div className="rounded-xl bg-slate-50 p-4"><div className="text-xs uppercase text-slate-500">Sample Output</div><div className="mt-1 text-sm font-mono text-slate-700">{challenge.sampleOutput || '-'}</div></div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-semibold text-slate-900">Examples</div>
                    <div className="mt-3 space-y-3 text-sm text-slate-700">
                      <div>
                        <div className="text-xs uppercase text-slate-500">Input</div>
                        <pre className="mt-1 whitespace-pre-wrap font-mono">{challenge.sampleInput || '-'}</pre>
                      </div>
                      <div>
                        <div className="text-xs uppercase text-slate-500">Expected Output</div>
                        <pre className="mt-1 whitespace-pre-wrap font-mono">{challenge.sampleOutput || '-'}</pre>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-semibold text-slate-900">Constraints</div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      {(challenge.constraints || []).length ? challenge.constraints.map((constraint, index) => (
                        <li key={`${constraint}-${index}`} className="flex gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                          <span>{constraint}</span>
                        </li>
                      )) : <li className="text-slate-500">No constraints provided.</li>}
                    </ul>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900">Public Test Cases</div>
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{challenge.testCases?.length || 0} cases</span>
                  </div>
                  <div className="mt-3 space-y-3">
                    {(challenge.testCases || []).length ? challenge.testCases.map((testCase, index) => (
                      <div key={`${index}-${testCase.input}`} className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                        <div className="font-semibold text-slate-900">Case {index + 1}</div>
                        <div className="mt-2 grid gap-3 md:grid-cols-2">
                          <div>
                            <div className="text-xs uppercase text-slate-500">Input</div>
                            <pre className="mt-1 whitespace-pre-wrap font-mono">{testCase.input}</pre>
                          </div>
                          <div>
                            <div className="text-xs uppercase text-slate-500">Expected Output</div>
                            <pre className="mt-1 whitespace-pre-wrap font-mono">{testCase.expectedOutput}</pre>
                          </div>
                        </div>
                      </div>
                    )) : <div className="text-sm text-slate-500">No public test cases available.</div>}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">Select a challenge to begin.</div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Code Editor</h3>
                <p className="text-sm text-slate-500">Edit your solution and run test cases against the current challenge.</p>
              </div>
              <div className="flex items-center gap-3">
                <select value={language} onChange={(event) => setLanguage(event.target.value)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm">
                  {LANGUAGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <button onClick={runCode} disabled={submitting} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
                  {submitting ? 'Running...' : 'Submit Code'}
                </button>
                <button onClick={runCode} disabled={submitting} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
                  {submitting ? 'Running...' : 'Run Code'}
                </button>
              </div>
            </div>
            {runError ? (
              <div className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">
                {runError}
              </div>
            ) : null}
            <div className="h-[32rem]">
              {editorTimedOut && !editorReady ? (
                <div className="h-full p-4">
                  <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    The Monaco editor is taking too long to load. You can still type your code below.
                  </div>
                  <textarea
                    value={sourceCode}
                    onChange={(event) => setSourceCode(event.target.value)}
                    className="h-[27rem] w-full resize-none rounded-xl border border-slate-300 p-4 font-mono text-sm text-slate-900 outline-none focus:border-slate-500"
                    spellCheck={false}
                  />
                </div>
              ) : (
                <Editor
                  language={editorLanguage}
                  value={sourceCode}
                  onMount={() => setEditorReady(true)}
                  onChange={(value) => setSourceCode(value || '')}
                  loading={<div className="flex h-full items-center justify-center text-slate-500">Loading editor...</div>}
                  theme="vs-dark"
                  options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on', automaticLayout: true }}
                />
              )}
            </div>
          </div>

          {submission && (
            <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Run Results</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4"><div className="text-xs uppercase text-slate-500">Status</div><div className="mt-1 text-lg font-semibold text-slate-900">{submission.status}</div></div>
                  <div className="rounded-xl bg-slate-50 p-4"><div className="text-xs uppercase text-slate-500">Score</div><div className="mt-1 text-lg font-semibold text-slate-900">{submission.score}</div></div>
                  <div className="rounded-xl bg-slate-50 p-4"><div className="text-xs uppercase text-slate-500">Runtime</div><div className="mt-1 text-lg font-semibold text-slate-900">{submission.runtimeMs} ms</div></div>
                </div>

                <div className="mt-5 space-y-3">
                  {submission.testResults?.length ? submission.testResults.map((result, index) => (
                    <div key={index} className={`rounded-xl border p-4 ${result.passed ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold text-slate-900">Test Case {index + 1}</div>
                        <span className="text-xs font-semibold uppercase tracking-[0.18em]">{result.passed ? 'Passed' : 'Failed'}</span>
                      </div>
                      <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                        <div><div className="text-xs uppercase text-slate-500">Input</div><pre className="mt-1 whitespace-pre-wrap font-mono text-slate-700">{result.input}</pre></div>
                        <div><div className="text-xs uppercase text-slate-500">Expected</div><pre className="mt-1 whitespace-pre-wrap font-mono text-slate-700">{result.expectedOutput}</pre></div>
                        <div><div className="text-xs uppercase text-slate-500">Actual</div><pre className="mt-1 whitespace-pre-wrap font-mono text-slate-700">{result.actualOutput}</pre></div>
                      </div>
                    </div>
                  )) : <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">Run code to see per-test feedback.</div>}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Leaderboard Preview</h3>
                <div className="mt-4 space-y-3">
                  {leaderboard.length ? leaderboard.slice(0, 5).map((entry, index) => (
                    <div key={entry.id || index} className="rounded-xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-slate-900">#{index + 1} {entry.challenge}</div>
                        <div className="text-lg font-bold text-slate-900">{entry.bestScore}</div>
                      </div>
                      <div className="mt-1 text-sm text-slate-500">{entry.language} · {entry.bestRuntimeMs || 0} ms</div>
                    </div>
                  )) : <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">Leaderboard will appear once submissions are recorded.</div>}
                </div>
              </div>
            </div>
          )}
        </main>
      </section>
    </div>
  )
}
