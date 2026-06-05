import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/api'
import LoadingOverlay from '../components/LoadingOverlay'
import { useToast } from '../components/ToastProvider'
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

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const RESUME_FILE_ENDPOINT = '/api/profile/resume/file'

function decodeHeaderValue(value) {
  try {
    return decodeURIComponent(value)
  } catch (error) {
    return value
  }
}

function getContentDispositionFilename(disposition) {
  if (!disposition) return ''

  const encodedMatch = disposition.match(/filename\*\s*=\s*(?:(?:UTF-8|utf-8)'')?([^;]+)/i)
  if (encodedMatch?.[1]) {
    const value = encodedMatch[1].trim().replace(/^"(.*)"$/, '$1')
    return decodeHeaderValue(value)
  }

  const plainMatch = disposition.match(/filename\s*=\s*("(?:[^"\\]|\\.)*"|[^;]+)/i)
  if (!plainMatch?.[1]) return ''

  const value = plainMatch[1].trim()
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/\\"/g, '"')
  }

  return value
}

function sanitizeFileName(fileName) {
  const clean = String(fileName || '').trim().replace(/[\\/:*?"<>|\u0000-\u001F]/g, '-')
  return clean || 'Resume'
}

function ensureFileNameExtension(fileName, contentType) {
  const safeName = sanitizeFileName(fileName)
  if (/\.[a-z0-9]{2,5}$/i.test(safeName)) return safeName

  const type = String(contentType || '').toLowerCase()
  if (type.includes('pdf')) return `${safeName}.pdf`
  if (type.includes('officedocument.wordprocessingml.document')) return `${safeName}.docx`
  if (type.includes('msword')) return `${safeName}.doc`

  return safeName
}

async function readJsonMessageFromBlob(blob) {
  try {
    const text = await blob.text()
    const parsed = JSON.parse(text)
    return parsed?.message || parsed?.error || ''
  } catch (error) {
    return ''
  }
}

export default function Resume() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [resumeMessage, setResumeMessage] = useState('')
  const [resumeError, setResumeError] = useState('')
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [resumeDeliveryAction, setResumeDeliveryAction] = useState(null)
  const dispatch = useDispatch()
  const toast = useToast()
  const fileInputRef = useRef(null)
  const objectUrlsRef = useRef(new Set())
  const navigate = useNavigate()

  const resumeUrl = user?.resumeUrl || user?.resume || ''
  const resumeFileName = user?.resumeFileName || getResumeName(resumeUrl)
  const hasResume = Boolean(resumeUrl)
  const isViewingResume = resumeDeliveryAction === 'view'
  const isDownloadingResume = resumeDeliveryAction === 'download'
  const isResumeDelivering = Boolean(resumeDeliveryAction)

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
      toast.error('Failed to load profile. Please refresh the page.')
      return null
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      objectUrlsRef.current.clear()
    }
  }, [])

  function trackObjectUrl(url, ttl = 5 * 60 * 1000) {
    objectUrlsRef.current.add(url)
    window.setTimeout(() => {
      URL.revokeObjectURL(url)
      objectUrlsRef.current.delete(url)
    }, ttl)
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
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

    // Validate file type and size
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(file.type)) {
      setResumeError('Only PDF, DOC, or DOCX files are allowed')
      return
    }
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setResumeError('File is too large. Maximum is 10MB')
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
      toast.success('Resume uploaded successfully')
      setResumeMessage('Resume uploaded successfully')
      setResumeFile(null)
      setUploadProgress(100)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (err) {
      console.error('Upload failed', err)
      const message = err.response?.data?.message || err.message || 'Upload failed'
      toast.error(message)
      setResumeError(message)
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
      setResumeFile(null)
      setAnalysisResult(null)
      setResumeMessage('Resume removed')
    } catch (err) {
      console.error('Remove failed', err)
      setResumeError(err.response?.data?.message || 'Remove failed')
    }
  }

  async function readFetchError(response) {
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      try {
        const payload = await response.json()
        return payload?.message || payload?.error || 'Resume request failed'
      } catch (error) {
        return 'Resume request failed'
      }
    }

    try {
      return (await response.text()) || 'Resume request failed'
    } catch (error) {
      return 'Resume request failed'
    }
  }

  async function refreshResumeAccessToken() {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Accept-Language': localStorage.getItem('preferredLanguage') || 'en',
      },
    })

    if (!response.ok) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      throw Object.assign(new Error('Your session has expired. Please sign in again.'), {
        status: response.status,
        code: 'TOKEN_EXPIRED',
      })
    }

    const data = await response.json().catch(() => null)
    const payload = data?.data || data
    const nextToken = payload?.token || payload?.accessToken || null

    if (!nextToken) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      throw Object.assign(new Error('Your session has expired. Please sign in again.'), {
        status: 401,
        code: 'TOKEN_EXPIRED',
      })
    }

    localStorage.setItem('token', nextToken)
    if (payload?.user) localStorage.setItem('user', JSON.stringify(payload.user))

    return nextToken
  }

  async function fetchResumeFile({ download = false, retrying = false } = {}) {
    if (!hasResume) {
      throw Object.assign(new Error('No resume file is available. Upload a resume first.'), {
        status: 404,
        code: 'NO_RESUME',
      })
    }

    let token = localStorage.getItem('token')
    if (!token) {
      throw Object.assign(new Error('Please sign in again before opening your resume.'), {
        status: 401,
        code: 'TOKEN_MISSING',
      })
    }

    const endpoint = download ? `${RESUME_FILE_ENDPOINT}?download=1` : RESUME_FILE_ENDPOINT
    const response = await fetch(endpoint, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/octet-stream',
        'Accept-Language': localStorage.getItem('preferredLanguage') || 'en',
      },
    })

    if (response.status === 401 && !retrying) {
      token = await refreshResumeAccessToken()
      if (token) return fetchResumeFile({ download, retrying: true })
    }

    if (!response.ok) {
      const message = await readFetchError(response)
      throw Object.assign(new Error(message), { status: response.status })
    }

    const contentType = response.headers.get('content-type') || ''
    const disposition = response.headers.get('content-disposition') || ''
    const blob = await response.blob()
    const blobType = blob.type || contentType || 'application/octet-stream'

    if (!blob || blob.size === 0) {
      throw Object.assign(new Error('The resume file is empty or unavailable.'), {
        code: 'INVALID_FILE',
      })
    }

    if (blobType.includes('application/json')) {
      const message = await readJsonMessageFromBlob(blob)
      throw Object.assign(new Error(message || 'The resume response was not a valid file.'), {
        code: 'INVALID_FILE',
      })
    }

    const headerFileName = getContentDispositionFilename(disposition)
    const filename = ensureFileNameExtension(headerFileName || resumeFileName || 'Resume', blobType)
    const typedBlob = blob.type ? blob : new Blob([blob], { type: blobType })

    return { blob: typedBlob, filename, contentType: blobType }
  }

  function handleResumeDeliveryError(error, fallbackMessage) {
    console.error('Resume delivery failed', error)

    let message = error?.message || fallbackMessage || 'Unable to access your resume. Please try again.'
    if (error?.code === 'TOKEN_MISSING') {
      message = 'Please sign in again before opening your resume.'
    } else if (error?.code === 'TOKEN_EXPIRED' || error?.status === 401) {
      message = 'Your session has expired. Please sign in again before opening your resume.'
    } else if (error?.status === 403) {
      message = 'You are not authorized to access this resume.'
    } else if (error?.status === 404 || error?.code === 'NO_RESUME') {
      message = 'No resume file is available. Upload a resume first.'
    } else if (error?.status === 502) {
      message = 'Resume storage is temporarily unavailable. Please try again.'
    } else if (error?.code === 'INVALID_FILE') {
      message = error.message || 'The resume file could not be opened.'
    }

    setResumeError(message)
    toast.error(message)
  }

  async function viewResume() {
    setResumeError('')
    setResumeMessage('')

    const token = localStorage.getItem('token')
    if (!token) {
      handleResumeDeliveryError({ code: 'TOKEN_MISSING' })
      return
    }

    const previewWindow = window.open('about:blank', '_blank')
    if (!previewWindow) {
      const message = 'Allow pop-ups to preview your resume in a new tab.'
      setResumeError(message)
      toast.error(message)
      return
    }

    try {
      previewWindow.opener = null
      previewWindow.document.title = 'Resume Preview'
      previewWindow.document.body.innerHTML = '<main style="min-height:100vh;display:grid;place-items:center;font-family:Inter,Arial,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;">Opening secure resume preview...</main>'
    } catch (error) {
      // Some browsers restrict writing to the temporary tab; location assignment still works.
    }

    setResumeDeliveryAction('view')
    try {
      const { blob } = await fetchResumeFile({ download: false })
      const objectUrl = URL.createObjectURL(blob)
      trackObjectUrl(objectUrl)
      previewWindow.location.assign(objectUrl)
      toast.success('Resume preview opened securely')
    } catch (error) {
      try {
        previewWindow.close()
      } catch (closeError) {}
      handleResumeDeliveryError(error, 'Unable to open resume preview. Please try again.')
    } finally {
      setResumeDeliveryAction(null)
    }
  }

  async function downloadResume() {
    setResumeError('')
    setResumeMessage('')
    setResumeDeliveryAction('download')

    try {
      const { blob, filename } = await fetchResumeFile({ download: true })
      const objectUrl = URL.createObjectURL(blob)
      trackObjectUrl(objectUrl, 30 * 1000)

      const link = document.createElement('a')
      link.href = objectUrl
      link.download = filename
      link.rel = 'noopener'
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast.success('Resume download started')
    } catch (error) {
      handleResumeDeliveryError(error, 'Unable to download resume. Please try again.')
    } finally {
      setResumeDeliveryAction(null)
    }
  }

  async function analyzeResumeAction() {
    setResumeError('')
    setResumeMessage('')
    setAnalysisResult(null)
    if (!resumeUrl) {
      setResumeError('No resume uploaded to analyze')
      return
    }
    try {
      setAnalysisLoading(true)
      const resp = await api.post('/api/resume/analyze', { }, { params: { url: resumeUrl } })
      // API expects file upload; however if resume already stored on server profile, server will accept download.
      // For now expect result in resp.data.data
      const data = resp?.data?.data || resp?.data
      setAnalysisResult(data)
    } catch (err) {
      console.error('Analyze failed', err)
      const message = err.response?.data?.message || err.message || 'Analysis failed'
      toast.error(message)
      setResumeError(message)
    } finally {
      setAnalysisLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 animate-fade-in">
      <LoadingOverlay
        visible={loading || resumeUploading || analysisLoading || isResumeDelivering}
        title={resumeUploading ? 'Uploading Resume' : analysisLoading ? 'Analyzing Resume' : isViewingResume ? 'Opening Resume' : isDownloadingResume ? 'Preparing Download' : 'Preparing Resume Center'}
        subtitle={resumeUploading ? 'Uploading your file with secure progress tracking.' : analysisLoading ? 'Generating AI insights and premium scorecards.' : isViewingResume ? 'Fetching your resume through the secure authenticated proxy.' : isDownloadingResume ? 'Preparing your secure resume download.' : 'Loading your resume workspace.'}
        progress={resumeUploading ? uploadProgress : undefined}
      />
      {/* Animated background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl">
          {/* Header */}
          <div className="mb-12 text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="inline-flex items-center gap-3 rounded-full border border-cyan-500/30 bg-cyan-500/5 px-4 py-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Resume Vault</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-300 bg-clip-text text-transparent">
              Manage Your Resume
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Securely upload, store, and manage your professional resume. Keep your latest version always accessible.
            </p>
          </div>

          {/* Main Card */}
          <div className="rounded-3xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden animate-fade-in premium-card" style={{ animationDelay: '0.2s' }}>
            {/* Success Animation */}
            {showSuccess && (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 animate-pulse pointer-events-none rounded-3xl z-50" />
            )}

            <div className="p-8 sm:p-12">
              {/* Upload Area */}
              <AnimatePresence mode="wait">
              {!hasResume ? (
                <motion.div
                  key="upload-section"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      Upload Resume
                    </h2>

                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={openFilePicker}
                      className={
                        'group relative overflow-hidden rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 ' +
                        (isDragActive
                          ? 'border-cyan-400 bg-cyan-500/10'
                          : 'border-slate-600 bg-slate-800/30 hover:border-cyan-400/50 hover:bg-slate-800/50')
                      }
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                      />

                      <div className="pointer-events-none">
                        <div className="flex justify-center mb-4">
                          <div className={
                            'w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ' +
                            (isDragActive
                              ? 'bg-cyan-500/30 scale-110'
                              : 'bg-slate-700/50 group-hover:scale-105')
                          }>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-300">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                        <p className="text-white font-semibold text-lg mb-1">
                          {isDragActive ? 'Drop your resume here' : 'Drag and drop your resume'}
                        </p>
                        <p className="text-slate-400 text-sm">
                          PDF, DOC, or DOCX files. Maximum 10MB.
                        </p>
                        <button
                          type="button"
                          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-2 text-sm font-semibold text-white hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 active:scale-95"
                        >
                          Browse Files
                        </button>
                      </div>
                    </div>

                    {resumeFile && (
                      <div className="mt-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-red-500/20 flex items-center justify-center">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-red-400">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <polyline points="14 2 14 10 22 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white truncate">{resumeFile.name}</p>
                              <p className="text-xs text-slate-400">{formatFileSize(resumeFile.size)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setResumeFile(null)}
                            className="text-slate-400 hover:text-slate-200 transition-colors"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-current">
                              <path d="M18 6l-12 12m0-12l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {resumeUploading && (
                    <div className="mb-8 animate-fade-in">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-300">Uploading...</p>
                        <p className="text-sm font-semibold text-cyan-400">{uploadProgress}%</p>
                      </div>
                      <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                          style={{ width: uploadProgress + '%' }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:border-slate-500 hover:bg-slate-700/50"
                    >
                      Choose File
                    </button>
                    <button
                      type="button"
                      onClick={uploadResume}
                      disabled={!resumeFile || resumeUploading}
                      className={
                        'rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-300 col-span-1 sm:col-span-2 ' +
                        (resumeFile && !resumeUploading
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600'
                          : 'bg-slate-700 text-slate-400 cursor-not-allowed')
                      }
                    >
                      {resumeUploading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Uploading...
                        </div>
                      ) : (
                        'Upload Resume'
                      )}
                    </button>
                  </div>

                </motion.div>
              ) : (
                <motion.div
                  key="current-resume"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-6 border-t border-slate-700 pt-8">
                    <h3 className="text-lg font-bold text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-emerald-400">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="14 2 14 10 22 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    Current Resume
                  </h3>

                  <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <p className="text-sm text-slate-400 mb-1">Filename</p>
                        <p className="text-white font-semibold truncate">{resumeFileName}</p>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                        <span className="text-xs font-semibold text-emerald-300">Uploaded</span>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-slate-700">
                      <button
                        type="button"
                        onClick={viewResume}
                        disabled={isResumeDelivering}
                        className="flex-1 rounded-lg bg-slate-700/50 border border-slate-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:border-cyan-500/50 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {isViewingResume ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-400">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                        {isViewingResume ? 'Opening...' : 'View'}
                      </button>
                      <button
                        type="button"
                        onClick={downloadResume}
                        disabled={isResumeDelivering}
                        className="flex-1 rounded-lg bg-slate-700/50 border border-slate-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:border-cyan-500/50 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {isDownloadingResume ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-400">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                        {isDownloadingResume ? 'Preparing...' : 'Download'}
                      </button>
                      <button
                        onClick={removeResume}
                        disabled={isResumeDelivering}
                        className="flex-1 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-400 transition-all duration-300 hover:border-red-500/50 hover:bg-red-500/20 flex items-center justify-center gap-2"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-current">
                          <path d="M19 7l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m3 0V4a2 2 0 012-2h4a2 2 0 012 2v3m-4 0a3 3 0 00-6 0h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Remove
                      </button>
                      <button
                        onClick={() => navigate('/resume/analytics')}
                        className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:from-indigo-700 hover:to-pink-700 flex items-center justify-center gap-2"
                      >
                        Open Analytics
                      </button>
                      <button
                        onClick={analyzeResumeAction}
                        disabled={analysisLoading}
                        className="flex-1 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:from-indigo-600 hover:to-violet-600 flex items-center justify-center gap-2"
                      >
                        {analysisLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Analyzing...
                          </div>
                        ) : (
                          'Analyze Resume'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                {/* Analysis Result */}
                {analysisResult && (
                  <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/30 p-6">
                    <h4 className="text-lg font-bold text-white mb-3">AI Resume Analysis</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <pre className="whitespace-pre-wrap text-sm text-slate-200">{JSON.stringify(analysisResult.analysis || analysisResult, null, 2)}</pre>
                      </div>
                      <div>
                        <div className="mb-4">
                          <p className="text-sm text-slate-400">ATS Score</p>
                          <div className="w-full h-3 bg-slate-700 rounded overflow-hidden mt-1">
                            <div className="h-3 bg-emerald-400" style={{ width: (analysisResult.analysis?.ATS || analysisResult.analysis?.ats || 0) + '%' }} />
                          </div>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm text-slate-400">Resume Quality</p>
                          <div className="w-full h-3 bg-slate-700 rounded overflow-hidden mt-1">
                            <div className="h-3 bg-cyan-400" style={{ width: (analysisResult.analysis?.resume_quality || 0) + '%' }} />
                          </div>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm text-slate-400">Interview Readiness</p>
                          <div className="w-full h-3 bg-slate-700 rounded overflow-hidden mt-1">
                            <div className="h-3 bg-rose-400" style={{ width: (analysisResult.analysis?.interview_readiness || 0) + '%' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
            </AnimatePresence>

            {resumeMessage && (
              <div className="mb-8 p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-sm text-emerald-200">{resumeMessage}</p>
                </div>
              </div>
            )}

            {resumeError && (
              <div className="mb-8 p-4 rounded-lg border border-red-500/30 bg-red-500/10 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                      <path d="M18 6l-12 12m0-12l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-sm text-red-200">{resumeError}</p>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
      </div>

    </div>
  )
}
