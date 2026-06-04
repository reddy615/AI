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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.16),_transparent_30%),#030712] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl">
        <div className="rounded-[2.5rem] border border-white/10 bg-slate-950/70 backdrop-blur-2xl shadow-[0_40px_120px_rgba(15,23,42,0.7)] overflow-hidden">
          <div className="relative overflow-hidden px-8 pb-10 pt-12 sm:px-12 sm:pt-16">
            <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-cyan-500/20 via-transparent to-transparent blur-3xl" />
            <div className="relative mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300 shadow-sm shadow-cyan-500/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-300">
                  <path d="M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 6l-4-4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 2v11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Resume Vault
              </span>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Premium resume upload</h1>
              <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">Securely upload your resume, keep it persisted across refreshes, and manage your latest version with a polished drag-and-drop upload experience.</p>
            </div>
          </div>

          <div className="border-t border-white/10 px-6 pb-10 sm:px-10">
            <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:p-8">
              <div className="flex flex-col gap-6 sm:gap-8">
                <div className="flex items-start gap-4 rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-950/80 to-slate-900/90 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.35)] sm:p-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-500/15 text-cyan-300 shadow-xl shadow-cyan-500/15">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-current">
                      <path d="M16 16V12H8v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 12V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 8l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20 18.5a2.5 2.5 0 01-2.5 2.5H6.5A2.5 2.5 0 014 18.5V7.5A2.5 2.5 0 016.5 5h3.743" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Drag & drop your resume</h2>
                    <p className="mt-1 text-sm text-slate-400">Support for PDF, DOC, and DOCX files. Upload your latest resume and keep it available across sessions.</p>
                  </div>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={openFilePicker}
                  className="group relative overflow-hidden rounded-[1.75rem] border border-dashed border-slate-500/40 bg-gradient-to-br from-slate-900/90 to-slate-950/90 p-8 text-center transition duration-300 hover:border-cyan-400/70 hover:bg-slate-900/95 cursor-pointer"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  />

                  <div className="pointer-events-none flex flex-col items-center justify-center gap-4">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/5 text-cyan-300 shadow-[0_24px_60px_rgba(6,182,212,0.15)] transition duration-300 group-hover:scale-105">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-current">
                        <path d="M7 16h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 12v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 2l4 4h-3v6h-2V6H8l4-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-white">Drop your file or browse</p>
                      <p className="text-sm text-slate-400">Tap to select from your device. Upload progress displays in real time.</p>
                    </div>
                    <div className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-white shadow-sm shadow-cyan-500/10 transition duration-300 group-hover:bg-cyan-500/15">
                      Browse files
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-end">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 shadow-inner shadow-slate-950/20">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Saved resume</p>
                    <p className="mt-3 text-base font-medium text-white">{resumeFileName || 'No resume uploaded'}</p>
                  </div>

                  <div className="flex flex-wrap justify-end gap-3">
                    {resumeUrl ? (
                      <>
                        <a href={resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/50 hover:bg-cyan-500/10">
                          <span>View Resume</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-300">
                            <path d="M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                            <path d="M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </a>
                        <a href={resumeUrl} download={resumeFileName || 'resume'} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/50 hover:bg-cyan-500/10">
                          <span>Download</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-300">
                            <path d="M12 4v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                            <path d="M8 14l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </a>
                        <button
                          onClick={removeResume}
                          className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                        >
                          <span>Remove</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                            <path d="M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-400">No saved resume yet</div>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex items-center justify-between gap-4 text-sm text-slate-300">
                    <span>{resumeFile ? `Selected: ${resumeFile.name}` : 'Ready for upload'}</span>
                    <span>{resumeUploading ? `${uploadProgress}% uploaded` : `${resumeUrl ? 'Resume stored securely' : 'Choose a file to upload'}`}</span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 transition-all duration-300" style={{ width: `${Math.max(uploadProgress, resumeUploading ? uploadProgress : 0)}%` }} />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/50 hover:bg-cyan-500/10"
                  >Choose file</button>
                  <button
                    type="button"
                    onClick={uploadResume}
                    disabled={!resumeFile || resumeUploading}
                    className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >{resumeUploading ? 'Uploading...' : 'Upload resume'}</button>
                  <button
                    type="button"
                    onClick={() => setResumeFile(null)}
                    disabled={!resumeFile || resumeUploading}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-red-300/50 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >Clear selection</button>
                </div>

                {resumeMessage ? <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{resumeMessage}</div> : null}
                {resumeError ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{resumeError}</div> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
