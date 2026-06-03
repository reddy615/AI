import React, { useEffect, useState, useRef } from 'react'
import api from '../api/api'
import { useDispatch } from 'react-redux'
import { setUser as setAuthUser } from '../store/store'

function getResumeName(resumePath) {
  if (!resumePath) return ''
  try {
    const url = new URL(resumePath)
    return url.pathname.split('/').filter(Boolean).pop() || ''
  } catch (e) {
    return String(resumePath).split('/').filter(Boolean).pop() || ''
  }
}

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [resumeMessage, setResumeMessage] = useState('')
  const [resumeError, setResumeError] = useState('')
  const dispatch = useDispatch()
  const fileInputRef = useRef(null)

  const resumeUrl = user?.resumeUrl || user?.resume || ''
  const resumeFileName = user?.resumeFileName || getResumeName(resumeUrl)

  async function loadProfile({ silent = false } = {}) {
    if (!silent) setLoading(true)
    try {
      const resp = await api.get('/api/profile')
      const data = resp?.data?.data?.user || resp?.data?.user || resp?.data || resp?.data?.profile || null
      setUser(data)
      dispatch(setAuthUser(data))
      if (data) localStorage.setItem('user', JSON.stringify(data))
      return data
    } catch (err) {
      console.error('Failed to load profile', err)
      return null
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    const f = e.dataTransfer?.files?.[0]
    if (f) setResumeFile(f)
  }

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  async function uploadResume(event) {
    if (event && event.preventDefault) event.preventDefault()
    setResumeError('')
    setResumeMessage('')

    const file = resumeFile
    if (!file) {
      setResumeError('Choose a PDF or Word document first.')
      return
    }

    const formData = new FormData()
    formData.append('resume', file)

    setResumeUploading(true)
    setUploadProgress(0)
    try {
      const response = await api.post('/api/profile/resume', formData, {
        headers: { 'Accept': 'application/json' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(pct)
          }
        },
      })

      const payload = response?.data?.data || response?.data || {}
      const uploaded = payload?.resumeUrl || payload?.resume || ''
      if (!uploaded) throw new Error('No resume URL returned')

      // refresh persisted profile and show success
      await loadProfile({ silent: true })
      setResumeMessage('Resume uploaded successfully')
      setResumeFile(null)
      setUploadProgress(100)
    } catch (err) {
      console.error('Upload failed', err)
      setResumeError(err.response?.data?.message || err.message || 'Upload failed')
    } finally {
      setResumeUploading(false)
      setTimeout(() => setUploadProgress(0), 800)
    }
  }

  async function removeResume() {
    setResumeError('')
    setResumeMessage('')
    try {
      await api.delete('/api/profile/resume')
      await loadProfile({ silent: true })
      setResumeMessage('Resume removed')
    } catch (err) {
      console.error('Remove failed', err)
      setResumeError(err.response?.data?.message || 'Remove failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700 p-6">
      <div className="w-full max-w-2xl">
        <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Your Resume</h2>
              <p className="text-sm text-slate-300">Upload and manage your resume. Secure, private, and persistent.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { window.location.href = '/' }}
                className="text-xs text-slate-300 hover:text-white transition"
              >Home</button>
            </div>
          </div>

          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="relative rounded-2xl p-6 bg-gradient-to-br from-white/3 to-white/2 border border-dashed border-white/20 hover:border-white/40 transition cursor-pointer"
            onClick={openFilePicker}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
            />

            <div className="flex flex-col items-center justify-center gap-4">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-white/6 shadow-inner animate-pulse">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-white stroke-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3v12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 7l4-4 4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="text-center">
                <div className="text-white font-semibold">Drag & drop your resume here</div>
                <div className="text-xs text-slate-300">or click to browse — PDF, DOC, DOCX</div>
              </div>

              <div className="w-full">
                {resumeFile ? (
                  <div className="flex items-center justify-between gap-4 bg-white/6 px-4 py-3 rounded-md">
                    <div className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 2v6h6" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <div className="text-sm text-white">{resumeFile.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={uploadResume}
                        disabled={resumeUploading}
                        className="px-3 py-1.5 bg-emerald-500 text-white rounded-md text-sm hover:bg-emerald-600 transition disabled:opacity-60"
                      >{resumeUploading ? 'Uploading...' : 'Upload'}</button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-300 text-center">No file selected</div>
                )}
              </div>
            </div>

            {/* progress bar */}
            <div className="absolute left-0 right-0 bottom-0 h-1 bg-white/5 rounded-b-2xl overflow-hidden" style={{ display: uploadProgress > 0 ? 'block' : 'none' }}>
              <div style={{ width: `${uploadProgress}%` }} className="h-full bg-emerald-400 transition-width duration-200" />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="text-sm text-slate-300">Saved Resume:</div>
                <div className="text-sm text-white font-medium">{resumeFileName || 'No resume uploaded'}</div>
              </div>

              <div className="flex items-center gap-3">
                {resumeUrl ? (
                  <>
                    <a href={resumeUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-white/6 text-white rounded-md hover:bg-white/10 transition text-sm">View Resume</a>
                    <a href={resumeUrl} download={resumeFileName || 'resume'} className="px-4 py-2 bg-white/6 text-white rounded-md hover:bg-white/10 transition text-sm">Download</a>
                    <button onClick={removeResume} className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm">Remove</button>
                  </>
                ) : (
                  <div className="text-sm text-slate-400">No resume stored on your profile</div>
                )}
              </div>
            </div>

            {resumeMessage ? <div className="text-sm text-emerald-400">{resumeMessage}</div> : null}
            {resumeError ? <div className="text-sm text-red-400">{resumeError}</div> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
              <button onClick={() => navigate(`/quiz?module=reasoning&count=36&refresh=${Date.now()}`)} className="rounded-xl bg-slate-800 px-4 py-3 text-left text-sm font-semibold text-white">Practice Reasoning</button>
              <button onClick={() => navigate(`/quiz?module=verbal&count=36&refresh=${Date.now()}`)} className="rounded-xl bg-slate-700 px-4 py-3 text-left text-sm font-semibold text-white">Practice Verbal</button>
              <button onClick={() => navigate('/coding')} className="rounded-xl bg-blue-600 px-4 py-3 text-left text-sm font-semibold text-white">Start Coding Assessment</button>
              <button onClick={() => navigate('/ai')} className="rounded-xl bg-emerald-600 px-4 py-3 text-left text-sm font-semibold text-white">Generate AI Questions</button>
              <button onClick={() => navigate('/interview')} className="rounded-xl bg-indigo-600 px-4 py-3 text-left text-sm font-semibold text-white">Start Mock Interview</button>
              <button onClick={() => navigate('/growth')} className="rounded-xl bg-sky-600 px-4 py-3 text-left text-sm font-semibold text-white">Open Growth Hub</button>
              {user?.role === 'admin' && <button onClick={() => navigate('/admin')} className="rounded-xl bg-slate-950 px-4 py-3 text-left text-sm font-semibold text-white">Open Admin Dashboard</button>}
              <button onClick={logout} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-700">Logout</button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}
