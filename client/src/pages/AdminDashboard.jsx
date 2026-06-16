import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BrainCircuit,
  Calculator,
  Code2,
  LoaderCircle,
  MessagesSquare,
  Search,
  ShieldCheck,
  Users,
  Plus,
  X,
  Trash2,
  Edit3,
} from 'lucide-react'
import api from '../api/api'
import Skeleton from '../components/Skeleton'
import LoadingOverlay from '../components/LoadingOverlay'
import { useToast } from '../components/ToastProvider'
import { useLanguage } from '../context/LanguageContext'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'assessments', label: 'Assessment Management' },
  { id: 'questions', label: 'Questions' },
  { id: 'interviews', label: 'Interviews' },
  { id: 'reports', label: 'Reports' },
]

const emptyAssessmentAccess = {
  technical: false,
  aptitude: false,
  coding: false,
  mockInterview: false,
  'Practice Test': false,
}

const allAssessmentAccess = {
  technical: true,
  aptitude: true,
  coding: true,
  mockInterview: true,
  'Practice Test': true,
}

const assessmentPageSize = 20

const assessmentOptions = [
  {
    key: 'technical',
    shortTitle: 'Technical',
    title: 'Technical Assessment',
    description: 'Core computer science and technical reasoning questions.',
    icon: BrainCircuit,
    accent: 'from-cyan-400 to-blue-500',
  },
  {
    key: 'aptitude',
    shortTitle: 'Aptitude',
    title: 'Aptitude Assessment',
    description: 'Quantitative aptitude, logical reasoning, and verbal ability.',
    icon: Calculator,
    accent: 'from-violet-400 to-fuchsia-500',
  },
  {
    key: 'coding',
    shortTitle: 'Coding',
    title: 'Coding Assessment',
    description: 'Programming challenges and evaluated code submissions.',
    icon: Code2,
    accent: 'from-emerald-400 to-teal-500',
  },
  {
    key: 'mockInterview',
    shortTitle: 'Mock',
    title: 'Mock Interview Assessment',
    description: 'Role-focused AI mock interview sessions and feedback.',
    icon: MessagesSquare,
    accent: 'from-amber-300 to-orange-500',
  },
  {
    key: 'Practice Test',
    shortTitle: 'Practice',
    title: 'Practice Test',
    description: 'Mixed-topic evaluation practice tests with section analytics.',
    icon: BrainCircuit,
    accent: 'from-pink-400 to-rose-500',
  },
]

function normalizeAssessmentAccess(access) {
  return {
    ...emptyAssessmentAccess,
    ...(access || {}),
  }
}

function buildLocalAssessmentSummary(users) {
  const assessments = assessmentOptions.reduce((summary, assessment) => {
    const usersWithAccess = users.filter(
      (user) => normalizeAssessmentAccess(user.assessmentAccess)[assessment.key]
    ).length

    summary[assessment.key] = {
      usersWithAccess,
      active: usersWithAccess > 0,
    }
    return summary
  }, {})

  return {
    totalUsers: users.length,
    assessments,
  }
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [data, setData] = useState({
    summary: null,
    users: [],
    questions: [],
    interviews: [],
    reports: null,
    leaderboard: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [assessmentUsers, setAssessmentUsers] = useState([])
  const [assessmentTotal, setAssessmentTotal] = useState(0)
  const [assessmentPage, setAssessmentPage] = useState(1)
  const [assessmentSummary, setAssessmentSummary] = useState(null)
  const [assessmentSearch, setAssessmentSearch] = useState('')
  const [assessmentLoading, setAssessmentLoading] = useState(false)
  const [assessmentList, setAssessmentList] = useState([])
  const [assessmentListLoading, setAssessmentListLoading] = useState(false)
  const [isAssessmentModalOpen, setAssessmentModalOpen] = useState(false)
  const [editingAssessment, setEditingAssessment] = useState(null)
  const [assessmentForm, setAssessmentForm] = useState({
    title: '',
    type: 'technical',
    difficulty: 'medium',
    duration: '30',
    count: '10',
    passingScore: '60',
    description: '',
    topics: '',
    status: true,
  })
  const [questionDrafts, setQuestionDrafts] = useState([
    {
      id: String(Date.now()),
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      topic: '',
      marks: '1',
      explanation: '',
    },
  ])
  const [uploadedPdf, setUploadedPdf] = useState(null)
  const [pdfParsing, setPdfParsing] = useState(false)
  const [parsedQuestions, setParsedQuestions] = useState([])
  const [pdfParseError, setPdfParseError] = useState(null)
  const [assessmentFormSaving, setAssessmentFormSaving] = useState(false)
  const [assessmentUpdating, setAssessmentUpdating] = useState({})
  const [bulkAssessmentUpdating, setBulkAssessmentUpdating] = useState(false)
  const assessmentRequestId = useRef(0)
  const { t } = useLanguage()
  const toast = useToast()

  const parseBlobError = async (responseData, defaultMessage) => {
    if (!(responseData instanceof Blob)) {
      return defaultMessage
    }

    try {
      const text = await responseData.text()
      const parsed = JSON.parse(text)
      return parsed.message || parsed.error || text || defaultMessage
    } catch {
      return responseData.type ? `${responseData.type} error` : defaultMessage
    }
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [summaryResponse, usersResponse, questionsResponse, interviewsResponse, reportsResponse] = await Promise.allSettled([
        api.get('/api/admin/summary'),
        api.get('/api/admin/users?limit=10'),
        api.get('/api/admin/questions?limit=10'),
        api.get('/api/admin/interviews'),
        api.get('/api/admin/reports'),
      ])

      const nextData = {
        summary: summaryResponse.status === 'fulfilled' ? (summaryResponse.value.data.data?.summary || summaryResponse.value.data.summary || null) : null,
        leaderboard: summaryResponse.status === 'fulfilled' ? (summaryResponse.value.data.data?.leaderboard || summaryResponse.value.data.leaderboard || []) : [],
        users: usersResponse.status === 'fulfilled' ? (usersResponse.value.data.data?.users || usersResponse.value.data.users || []) : [],
        questions: questionsResponse.status === 'fulfilled' ? (questionsResponse.value.data.data?.questions || questionsResponse.value.data.questions || []) : [],
        interviews: interviewsResponse.status === 'fulfilled' ? (interviewsResponse.value.data.data?.sessions || interviewsResponse.value.data.sessions || []) : [],
        reports: reportsResponse.status === 'fulfilled' ? (reportsResponse.value.data.data?.reports || reportsResponse.value.data.reports || null) : null,
      }

      setData(nextData)

      const failures = [summaryResponse, usersResponse, questionsResponse, interviewsResponse, reportsResponse].filter((item) => item.status === 'rejected')
      if (failures.length === 5) {
        setError('No admin data could be loaded.')
        toast.error('Unable to load admin dashboard. Please try again later.')
      }
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to load admin data'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const loadAssessmentSummary = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/assessment-access/summary')
      const payload = response.data?.data || response.data
      setAssessmentSummary(payload?.summary || null)
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to load assessment summary'
      toast.error(message)
    }
  }, [toast])

  const loadAssessmentUsers = useCallback(async ({ page = 1, search = '' } = {}) => {
    const requestId = assessmentRequestId.current + 1
    assessmentRequestId.current = requestId
    setAssessmentLoading(true)

    try {
      const response = await api.get('/api/admin/users', {
        params: {
          page,
          limit: assessmentPageSize,
          search: search.trim() || undefined,
        },
      })
      const payload = response.data?.data || response.data

      if (requestId !== assessmentRequestId.current) return

      setAssessmentUsers(payload?.users || [])
      setAssessmentTotal(Number(payload?.total) || 0)
    } catch (requestError) {
      if (requestId !== assessmentRequestId.current) return
      const message = requestError.response?.data?.message || 'Unable to load assessment users'
      toast.error(message)
    } finally {
      if (requestId === assessmentRequestId.current) {
        setAssessmentLoading(false)
      }
    }
  }, [toast])

  const loadAssessmentList = useCallback(async () => {
    setAssessmentListLoading(true)
    try {
      const response = await api.get('/api/admin/assessments')
      const payload = response.data?.data || response.data
      setAssessmentList(Array.isArray(payload?.assessments) ? payload.assessments : [])
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to load assessments'
      toast.error(message)
    } finally {
      setAssessmentListLoading(false)
    }
  }, [toast])

  const resetAssessmentForm = () => {
    setEditingAssessment(null)
    setAssessmentForm({
      title: '',
      type: 'technical',
      difficulty: 'medium',
      duration: '30',
      count: '10',
      passingScore: '60',
      description: '',
      topics: '',
      status: true,
    })
    setQuestionDrafts([
      {
        id: String(Date.now()),
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        topic: '',
        category: '',
        marks: '1',
        explanation: '',
      },
    ])
  }

  const createQuestionDraft = () => ({
    id: String(Date.now()) + Math.random(),
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    topic: '',
    category: assessmentForm.type === 'Practice Test' ? 'Aptitude' : '',
    marks: '1',
    explanation: '',
  })

  const openCreateAssessmentModal = () => {
    resetAssessmentForm()
    setAssessmentModalOpen(true)
  }

  const openEditAssessmentModal = (assessment) => {
    setEditingAssessment(assessment)
    setAssessmentForm({
      title: assessment.title || '',
      type: assessment.accessKey || 'technical',
      difficulty: assessment.difficulty || 'medium',
      duration: String(assessment.duration || 30),
      count: String(assessment.count || 10),
      passingScore: String(assessment.passingScore || 60),
      description: assessment.description || '',
      topics: Array.isArray(assessment.topics) ? assessment.topics.join(', ') : '',
      status: assessment.active !== false,
    })
    setQuestionDrafts(
      Array.isArray(assessment.questions) && assessment.questions.length
        ? assessment.questions.map((question) => ({
          id: question._id || String(Date.now()) + Math.random(),
          text: question.text || '',
          options: Array.isArray(question.options) ? question.options.slice(0, 4).concat(['', '', '', '']).slice(0, 4) : ['', '', '', ''],
          correctAnswer: typeof question.correctAnswer === 'number' ? question.correctAnswer : 0,
          topic: question.topic || '',
          category: question.category || '',
          marks: String(question.marks || 1),
          explanation: question.explanation || '',
        }))
        : [createQuestionDraft()]
    )
    setAssessmentModalOpen(true)
  }

  const updateQuestionDraft = (index, field, value) => {
    setQuestionDrafts((current) => current.map((question, idx) => {
      if (idx !== index) return question
      if (field === 'options') {
        return { ...question, options: value }
      }
      return { ...question, [field]: value }
    }))
  }

  const addQuestionDraft = () => {
    setQuestionDrafts((current) => [...current, createQuestionDraft()])
  }

  const removeQuestionDraft = (index) => {
    setQuestionDrafts((current) => current.filter((_, idx) => idx !== index))
  }

  const saveAssessment = async () => {
    setAssessmentFormSaving(true)
    try {
      const payload = {
        title: assessmentForm.title,
        description: assessmentForm.description,
        accessKey: assessmentForm.type,
        module: assessmentForm.type === 'technical' ? 'reasoning' : assessmentForm.type === 'aptitude' ? 'aptitude' : null,
        category: assessmentForm.type,
        difficulty: assessmentForm.difficulty,
        count: Number(assessmentForm.count) || 10,
        duration: Number(assessmentForm.duration) || 30,
        passingScore: Number(assessmentForm.passingScore) || 60,
        topics: assessmentForm.topics
          .split(',')
          .map((topic) => topic.trim())
          .filter(Boolean),
        active: assessmentForm.status === true,
        questions: questionDrafts.map((question) => ({
          text: question.text,
          options: question.options.map((option) => option || ''),
          correctAnswer: Number(question.correctAnswer) || 0,
          topic: question.topic || question.category || '',
          category: question.category || '',
          marks: Number(question.marks) || 1,
          explanation: question.explanation,
        })),
      }

      if (editingAssessment) {
        await api.patch(`/api/admin/assessments/${editingAssessment._id}`, payload)
        toast.success('Assessment updated successfully')
      } else {
        await api.post('/api/admin/assessments', payload)
        toast.success('Assessment created successfully')
      }

      setAssessmentModalOpen(false)
      resetAssessmentForm()
      loadAssessmentList()
      loadAssessmentSummary()
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to save assessment'
      toast.error(message)
    } finally {
      setAssessmentFormSaving(false)
    }
  }

  const handleDeleteAssessment = async (assessment) => {
    if (!window.confirm(`Delete assessment "${assessment.title}"? This cannot be undone.`)) {
      return
    }

    try {
      await api.delete(`/api/admin/assessments/${assessment._id}`)
      toast.success('Assessment deleted')
      await loadAssessmentList()
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to delete assessment'
      toast.error(message)
    }
  }

  const handleToggleAssessmentActive = async (assessment) => {
    try {
      await api.patch(`/api/admin/assessments/${assessment._id}`, { active: !assessment.active })
      toast.success(`Assessment ${assessment.active ? 'deactivated' : 'activated'}`)
      await loadAssessmentList()
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to update assessment status'
      toast.error(message)
    }
  }

  useEffect(() => {
    if (activeTab !== 'assessments') return undefined

    loadAssessmentSummary()
    loadAssessmentList()
    return undefined
  }, [activeTab, loadAssessmentSummary, loadAssessmentList])

  useEffect(() => {
    if (activeTab !== 'assessments') return undefined

    const timer = window.setTimeout(() => {
      loadAssessmentUsers({
        page: assessmentPage,
        search: assessmentSearch,
      })
    }, 250)

    return () => window.clearTimeout(timer)
  }, [activeTab, assessmentPage, assessmentSearch, loadAssessmentUsers])

  const metrics = useMemo(() => {
    if (!data.summary) return []
    return [
      { label: 'Users', value: data.summary.userCount ?? 0 },
      { label: 'Active', value: data.summary.activeUserCount ?? 0 },
      { label: 'Questions', value: (Number(data.summary.questionCount) || 0) + (Number(data.summary.aiQuestionCount) || 0) },
      { label: 'Sessions', value: data.summary.interviewCount ?? 0 },
      { label: 'Attempts', value: (Number(data.summary.attemptCount) || 0) + (Number(data.summary.codingCount) || 0) },
      { label: 'Avg XP', value: data.summary.averageXp ?? 0 },
    ]
  }, [data.summary])

  const [reminderLoading, setReminderLoading] = useState({})

  const updateAssessmentAccess = async (user, assessmentKey) => {
    const userId = user?._id || user?.id
    if (!userId) {
      toast.error('User ID not found')
      return
    }

    const updateKey = `${userId}:${assessmentKey}`
    if (Object.keys(assessmentUpdating).some((key) => key.startsWith(`${userId}:`))) {
      return
    }

    const previousAccess = normalizeAssessmentAccess(user.assessmentAccess)

    let updatePayload = {}
    let nextValue

    if (assessmentKey === 'ALL') {
      const isCurrentlyAllSelected = assessmentOptions.every((opt) => previousAccess[opt.key])
      nextValue = !isCurrentlyAllSelected
      assessmentOptions.forEach((opt) => {
        updatePayload[opt.key] = nextValue
      })
    } else {
      nextValue = !previousAccess[assessmentKey]
      updatePayload[assessmentKey] = nextValue
    }

    const optimisticAccess = {
      ...previousAccess,
      ...updatePayload,
    }

    setAssessmentUpdating((current) => ({ ...current, [updateKey]: true }))
    setAssessmentUsers((current) => current.map((item) => (
      (item._id || item.id) === userId
        ? { ...item, assessmentAccess: optimisticAccess }
        : item
    )))

    setAssessmentSummary((current) => {
      if (!current?.assessments) return current

      const nextAssessments = { ...current.assessments }
      let hasChanges = false

      Object.keys(updatePayload).forEach((key) => {
        const assessmentInfo = nextAssessments[key]
        if (!assessmentInfo) return

        const wasEnabled = previousAccess[key]
        const isEnabled = updatePayload[key]

        if (wasEnabled !== isEnabled) {
          const usersWithAccess = Math.max(
            0,
            Number(assessmentInfo.usersWithAccess || 0) + (isEnabled ? 1 : -1)
          )
          nextAssessments[key] = {
            ...assessmentInfo,
            usersWithAccess,
            active: usersWithAccess > 0,
          }
          hasChanges = true
        }
      })

      return hasChanges ? { ...current, assessments: nextAssessments } : current
    })

    try {
      const response = await api.put(`/api/admin/users/${userId}/assessment-access`, {
        assessmentAccess: updatePayload,
      })
      const payload = response.data?.data || response.data
      const updatedAccess = normalizeAssessmentAccess(payload?.assessmentAccess || optimisticAccess)

      setAssessmentUsers((current) => current.map((item) => (
        (item._id || item.id) === userId
          ? { ...item, assessmentAccess: updatedAccess }
          : item
      )))
      setData((current) => ({
        ...current,
        users: current.users.map((item) => (
          (item._id || item.id) === userId
            ? { ...item, assessmentAccess: updatedAccess }
            : item
        )),
      }))
      loadAssessmentSummary()
    } catch (requestError) {
      setAssessmentUsers((current) => current.map((item) => (
        (item._id || item.id) === userId
          ? { ...item, assessmentAccess: previousAccess }
          : item
      )))

      setAssessmentSummary((current) => {
        if (!current?.assessments) return current

        const nextAssessments = { ...current.assessments }
        let hasChanges = false

        Object.keys(updatePayload).forEach((key) => {
          const assessmentInfo = nextAssessments[key]
          if (!assessmentInfo) return

          const wasEnabled = previousAccess[key]
          const attemptedValue = updatePayload[key]

          if (wasEnabled !== attemptedValue) {
            const usersWithAccess = Math.max(
              0,
              Number(assessmentInfo.usersWithAccess || 0) + (wasEnabled ? 1 : -1)
            )
            nextAssessments[key] = {
              ...assessmentInfo,
              usersWithAccess,
              active: usersWithAccess > 0,
            }
            hasChanges = true
          }
        })

        return hasChanges ? { ...current, assessments: nextAssessments } : current
      })

      const message = requestError.response?.data?.message || 'Unable to update assessment access'
      toast.error(message)
    } finally {
      setAssessmentUpdating((current) => {
        const next = { ...current }
        delete next[updateKey]
        return next
      })
    }
  }

  const bulkUpdateAssessmentAccess = async (enabled) => {
    const action = enabled ? 'grant all assessment access' : 'revoke all assessment access'
    if (!window.confirm(`Are you sure you want to ${action} for every user?`)) return

    setBulkAssessmentUpdating(true)
    try {
      const response = await api.put('/api/admin/assessment-access/bulk', { enabled })
      const payload = response.data?.data || response.data
      const nextAccess = enabled ? allAssessmentAccess : emptyAssessmentAccess

      setAssessmentUsers((current) => current.map((user) => ({
        ...user,
        assessmentAccess: { ...nextAccess },
      })))
      setData((current) => ({
        ...current,
        users: current.users.map((user) => ({
          ...user,
          assessmentAccess: { ...nextAccess },
        })),
      }))
      setAssessmentSummary(payload?.summary || buildLocalAssessmentSummary(assessmentUsers))
      toast.success(enabled
        ? 'Assessment access granted to all users'
        : 'Assessment access revoked for all users')
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to update assessment access'
      toast.error(message)
    } finally {
      setBulkAssessmentUpdating(false)
    }
  }

  const updateUser = async (userId, payload) => {
    try {
      await api.patch(`/api/admin/users/${userId}`, payload)
      setData((current) => ({
        ...current,
        users: current.users.map((user) => (
          (user._id || user.id) === userId ? { ...user, ...payload } : user
        )),
      }))
      toast.success('User settings updated successfully')
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to update user'
      setError(message)
      toast.error(message)
    }
  }

  const handleSendResumeReminder = async (user) => {
    console.log('USER DATA:', user)
    console.log('RESUME URL:', user.resumeUrl)

    const userId = user?._id || user?.id
    if (!userId) {
      toast.error('User ID not found')
      return
    }

    setReminderLoading((prev) => ({ ...prev, [userId]: true }))
    try {
      await api.post(`/api/admin/users/${userId}/send-resume-reminder`)
      toast.success('Reminder email sent successfully')
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to send reminder email'
      setError(message)
      toast.error(message)
    } finally {
      setReminderLoading((prev) => ({ ...prev, [userId]: false }))
    }
  }

  const handleViewResume = async (user) => {
    const userId = user?._id || user?.id
    if (!userId) {
      toast.error('User ID not found')
      return
    }

    try {
      // Fetch resume file as blob using authenticated admin endpoint
      const response = await api.get(`/api/admin/users/${userId}/resume`, {
        responseType: 'blob',
      })

      // Create blob URL for inline viewing
      const blobUrl = window.URL.createObjectURL(response.data)
      
      // Open in new tab (browser will render PDF inline if possible)
      const newTab = window.open(blobUrl, '_blank', 'noopener,noreferrer')
      if (newTab) {
        newTab.focus()
      }

      // Clean up blob URL after a short delay to ensure the new tab has loaded
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl)
      }, 5000)

      toast.success('Resume opened in new tab')
    } catch (requestError) {
      let message = requestError.message || 'Failed to view resume'
      if (requestError.response) {
        message = await parseBlobError(requestError.response.data, message)
      }
      toast.error(message)
    }
  }

  const handleDownloadResume = async (user) => {
    const userId = user?._id || user?.id
    if (!userId) {
      toast.error('User ID not found')
      return
    }

    try {
      // Fetch resume file as blob using authenticated admin endpoint with download flag
      const response = await api.get(`/api/admin/users/${userId}/resume`, {
        responseType: 'blob',
        params: { download: 'true' },
      })

      // Create blob URL for download
      const blobUrl = window.URL.createObjectURL(response.data)
      
      const disposition = response.headers['content-disposition'] || response.headers['Content-Disposition'] || ''
      const filenameMatch = disposition.match(/filename\*=UTF-8''([^;\n\r]+)/i) || disposition.match(/filename="([^"]+)"/i) || disposition.match(/filename=([^;\n\r]+)/i)
      const filename = (filenameMatch && filenameMatch[1] ? decodeURIComponent(filenameMatch[1]) : user.resumeFileName) || 'resume.pdf'
      
      // Create temporary anchor element to trigger download
      const link = document.createElement('a')
      link.href = blobUrl
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      
      // Clean up after the browser has started processing the download
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(blobUrl)
      }, 5000)

      toast.success('Resume downloaded successfully')
    } catch (requestError) {
      let message = requestError.message || 'Failed to download resume'
      if (requestError.response) {
        message = await parseBlobError(requestError.response.data, message)
      }
      toast.error(message)
    }
  }

  const formatResumeDate = (d) => {
    if (!d) return '-'
    try {
      const date = new Date(d)
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch (e) {
      return String(d)
    }
  }

  const renderOverview = () => (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-28" />)
          : metrics.length ? metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-sm uppercase tracking-[0.18em] text-slate-500">{metric.label}</div>
                <div className="mt-2 text-3xl font-bold text-slate-900">{metric.value}</div>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500 xl:col-span-3">
                No analytics available.
              </div>
            )}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Top Users</h2>
          <div className="mt-4 space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-16" />)
            ) : data.leaderboard.length ? (
              data.leaderboard.map((entry) => (
                <div key={entry.userId} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <div>
                    <div className="font-semibold text-slate-900">#{entry.rank} {entry.name}</div>
                    <div className="text-sm text-slate-500">Level {entry.level} · {entry.preferredLanguage}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{entry.xp} XP</div>
                    <div className="text-xs text-slate-500">Streak {entry.streak}</div>
                  </div>
                </div>
              ))
            ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  No leaderboard data yet.
                </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Platform Reports</h2>
          <div className="mt-4 space-y-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : data.reports ? (
              Array.isArray(data.reports) ? (
                <div className="overflow-auto rounded-2xl border border-slate-100 bg-white p-2">
                  <table className="min-w-full text-sm">
                    <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
                      <tr>
                        <th className="py-2 px-3 text-left">Type</th>
                        <th className="py-2 px-3 text-left">Source</th>
                        <th className="py-2 px-3 text-left">Date</th>
                        <th className="py-2 px-3 text-left">Status</th>
                        <th className="py-2 px-3 text-left">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.reports.map((r, idx) => (
                        <tr key={r.id || r._id || idx} className="hover:bg-slate-50">
                          <td className="py-3 px-3 text-slate-700">{r.type || r.reportType || 'report'}</td>
                          <td className="py-3 px-3 text-slate-700 truncate max-w-[180px]">{r.source || r.origin || r.userEmail || 'system'}</td>
                          <td className="py-3 px-3 text-slate-700">{formatDate(r.createdAt || r.date)}</td>
                          <td className="py-3 px-3 text-slate-700">{r.status || r.state || 'open'}</td>
                          <td className="py-3 px-3 text-slate-700 truncate max-w-[280px]">{r.summary || r.message || r.note || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.keys(data.reports).length ? Object.entries(data.reports).map(([k, v]) => (
                    <div key={k} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="text-xs text-slate-500">{k}</div>
                      <div className="mt-2 font-semibold text-slate-900">{typeof v === 'number' ? v : (Array.isArray(v) ? v.length : String(v).slice(0, 120))}</div>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                      No reports available.
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                No reports available.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )

  const renderUsers = () => (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-slate-900">User Management</h2>
        <p className="text-sm text-slate-500">Manage roles, account status, resumes, and email reminders.</p>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Language</th>
              <th className="px-4 py-3">XP</th>
              <th className="px-4 py-3">Resume</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {loading ? (
              <tr><td className="px-4 py-4" colSpan="6"><Skeleton className="h-10" /></td></tr>
            ) : data.users.length ? data.users.map((user) => (
              <tr key={user._id || user.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-4">
                  <div className="font-semibold text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </td>
                <td className="px-4 py-4 capitalize text-slate-700">{user.role}</td>
                <td className="px-4 py-4 uppercase text-slate-700">{user.preferredLanguage || 'en'}</td>
                <td className="px-4 py-4 text-slate-700">{user.xp || 0}</td>
                <td className="px-4 py-4">
                  {user.hasResume ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                          ✓ Uploaded
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-[150px]" title={user.resumeFileName}>
                        {user.resumeFileName || 'resume'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {formatResumeDate(user.resumeUploadedAt)}
                      </div>
                    </div>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      Not Uploaded
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {user.resumeUrl ? (
                      <>
                        <button 
                          onClick={() => handleViewResume(user)}
                          title={`View ${user.resumeFileName || 'resume'}`}
                          className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleDownloadResume(user)}
                          title={`Download ${user.resumeFileName || 'resume'}`}
                          className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition"
                        >
                          Download
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleSendResumeReminder(user)}
                        disabled={Boolean(reminderLoading[user._id || user.id])}
                        className="rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 px-3 py-1.5 text-xs font-semibold text-white shadow-lg hover:from-orange-600 hover:via-amber-400 hover:to-orange-500 transition disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {reminderLoading[user._id || user.id] ? 'Sending...' : 'Send Mail'}
                      </button>
                    )}
                    <button 
                      onClick={() => updateUser(user._id || user.id, { role: user.role === 'admin' ? 'user' : 'admin' })} 
                      className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
                    >
                      Toggle Role
                    </button>
                    <button 
                      onClick={() => updateUser(user._id || user.id, { isActive: !user.isActive })} 
                      className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td className="px-4 py-6 text-sm text-slate-500" colSpan="6">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  /*
  const renderAssessmentAccessModal = () => {
    const accessEnabled = Object.values(assessmentAccess).some(Boolean)

    return (
      <AnimatePresence>
        {assessmentAccessUser ? (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !assessmentAccessSaving) {
                setAssessmentAccessUser(null)
              }
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="assessment-access-title"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 text-white shadow-2xl shadow-black/40"
            >
              <div className="flex items-start justify-between border-b border-slate-800 p-6 sm:p-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                    User permissions
                  </p>
                  <h2 id="assessment-access-title" className="mt-2 text-2xl font-bold">
                    Assessment Access
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {assessmentAccessUser.name} · {assessmentAccessUser.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAssessmentAccessUser(null)}
                  disabled={assessmentAccessSaving}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
                  aria-label="Close assessment access dialog"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6 p-6 sm:p-7">
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl p-2.5 ${accessEnabled ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'}`}>
                      {accessEnabled
                        ? <ShieldCheck className="h-5 w-5" />
                        : <LockKeyhole className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Assessment Access Status</div>
                      <div className="text-xs text-slate-500">At least one permission must be enabled to start an assessment.</div>
                    </div>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${accessEnabled ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'}`}>
                    {accessEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-white">Available Assessments</h3>
                    <button
                      type="button"
                      onClick={grantAllAssessments}
                      disabled={assessmentAccessLoading || assessmentAccessSaving}
                      className="text-sm font-semibold text-cyan-300 transition hover:text-cyan-200 disabled:opacity-50"
                    >
                      Grant Access To All
                    </button>
                  </div>

                  <div className="space-y-3">
                    {assessmentOptions.map((assessment) => {
                      const enabled = assessmentAccess[assessment.key]

                      return (
                        <div
                          key={assessment.key}
                          className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
                        >
                          <div>
                            <div className="font-semibold text-slate-100">{assessment.title}</div>
                            <div className="mt-1 text-sm leading-5 text-slate-500">{assessment.description}</div>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={enabled}
                            aria-label={`${enabled ? 'Revoke' : 'Grant'} ${assessment.title} access`}
                            disabled={assessmentAccessLoading || assessmentAccessSaving}
                            onClick={() => setAssessmentAccess((current) => ({
                              ...current,
                              [assessment.key]: !current[assessment.key],
                            }))}
                            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 ${enabled ? 'bg-cyan-500' : 'bg-slate-700'}`}
                          >
                            <span
                              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-800 p-6 sm:flex-row sm:justify-end sm:p-7">
                <button
                  type="button"
                  onClick={() => setAssessmentAccessUser(null)}
                  disabled={assessmentAccessSaving}
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveAssessmentAccess}
                  disabled={assessmentAccessLoading || assessmentAccessSaving}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {assessmentAccessSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    )
  }

  */

  const renderUserAssessmentControls = (user) => {
    const userId = user._id || user.id
    const access = normalizeAssessmentAccess(user.assessmentAccess)
    const isAllSelected = assessmentOptions.every((opt) => access[opt.key])

    const userIsUpdating = Object.keys(assessmentUpdating).some(
      (key) => key.startsWith(`${userId}:`)
    )

    return (
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-3 2xl:grid-cols-6">
        <div
          className={`flex min-w-[8.25rem] items-center justify-between gap-2 rounded-xl border px-3 py-2 transition-all duration-300 ${
            isAllSelected
              ? 'border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
              : 'border-slate-700/80 bg-slate-950/70'
          }`}
        >
          <span className={`text-xs font-bold ${isAllSelected ? 'text-cyan-300' : 'text-slate-300'}`}>Access All</span>
          <button
            type="button"
            role="switch"
            aria-checked={isAllSelected}
            aria-label={`${isAllSelected ? 'Disable' : 'Enable'} all assessments for ${user.name}`}
            disabled={bulkAssessmentUpdating || userIsUpdating}
            onClick={() => updateAssessmentAccess(user, 'ALL')}
            className={`relative h-[26px] w-[48px] shrink-0 rounded-full transition-all duration-[250ms] ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-wait disabled:opacity-60 overflow-hidden ${
              isAllSelected ? 'bg-cyan-500' : 'bg-slate-700'
            }`}
          >
            {Boolean(assessmentUpdating[`${userId}:ALL`]) ? (
              <LoaderCircle className="absolute left-[16px] top-[5px] h-4 w-4 animate-spin text-white" />
            ) : (
              <span
                className={`absolute top-[3px] left-[3px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-[250ms] ease-in-out ${
                  isAllSelected ? 'translate-x-[22px]' : 'translate-x-0'
                }`}
              />
            )}
          </button>
        </div>

        {assessmentOptions.map((assessment) => {
          const enabled = access[assessment.key]
          const updating = Boolean(assessmentUpdating[`${userId}:${assessment.key}`])

          return (
            <div
              key={assessment.key}
              className="flex min-w-[8.25rem] items-center justify-between gap-2 rounded-xl border border-slate-700/80 bg-slate-950/70 px-3 py-2"
            >
              <span className="text-xs font-medium text-slate-300">{assessment.shortTitle}</span>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={`${enabled ? 'Disable' : 'Enable'} ${assessment.title} for ${user.name}`}
                disabled={bulkAssessmentUpdating || userIsUpdating}
                onClick={() => updateAssessmentAccess(user, assessment.key)}
                className={`relative h-[26px] w-[48px] shrink-0 rounded-full transition-all duration-[250ms] ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-wait disabled:opacity-60 overflow-hidden ${
                  enabled ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                {updating ? (
                  <LoaderCircle className="absolute left-[16px] top-[5px] h-4 w-4 animate-spin text-white" />
                ) : (
                  <span
                    className={`absolute top-[3px] left-[3px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-[250ms] ease-in-out ${
                      enabled ? 'translate-x-[22px]' : 'translate-x-0'
                    }`}
                  />
                )}
              </button>
            </div>
          )
        })}
      </div>
    )
  }

  const renderAssessmentModal = () => {
    if (!isAssessmentModalOpen) return null

    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
        <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 text-white shadow-2xl shadow-black/40">
          <div className="flex items-start justify-between border-b border-slate-800 p-6 sm:p-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                {editingAssessment ? 'Edit assessment' : 'New assessment'}
              </p>
              <h2 className="mt-2 text-2xl font-bold">{editingAssessment ? 'Update Assessment' : 'Create New Assessment'}</h2>
              <p className="mt-2 text-sm text-slate-400">
                Configure assessment details and optional question templates for this assignment.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAssessmentModalOpen(false)}
              className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              aria-label="Close assessment form"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6 p-6 sm:p-7">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-200">Title</span>
                <input
                  type="text"
                  value={assessmentForm.title}
                  onChange={(event) => setAssessmentForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Assessment title"
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-200">Type</span>
                <select
                  value={assessmentForm.type}
                  onChange={(event) => {
                    const selectedType = event.target.value
                    setAssessmentForm((current) => ({
                      ...current,
                      type: selectedType,
                      topics: selectedType === 'Practice Test'
                        ? 'Coding, Aptitude, Verbal, Reasoning, Advanced Aptitude'
                        : current.topics
                    }))
                  }}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                >
                  {assessmentOptions.map((option) => (
                    <option key={option.key} value={option.key}>{option.title}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-200">Difficulty</span>
                <select
                  value={assessmentForm.difficulty}
                  onChange={(event) => setAssessmentForm((current) => ({ ...current, difficulty: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-200">Status</span>
                <select
                  value={assessmentForm.status ? 'active' : 'inactive'}
                  onChange={(event) => setAssessmentForm((current) => ({ ...current, status: event.target.value === 'active' }))}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="text-sm font-semibold text-slate-200">Duration (min)</span>
                <input
                  type="number"
                  min="1"
                  value={assessmentForm.duration}
                  onChange={(event) => setAssessmentForm((current) => ({ ...current, duration: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-200">Questions</span>
                <input
                  type="number"
                  min="1"
                  value={assessmentForm.count}
                  onChange={(event) => setAssessmentForm((current) => ({ ...current, count: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-200">Passing Score (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={assessmentForm.passingScore}
                  onChange={(event) => setAssessmentForm((current) => ({ ...current, passingScore: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-200">Description</span>
              <textarea
                value={assessmentForm.description}
                onChange={(event) => setAssessmentForm((current) => ({ ...current, description: event.target.value }))}
                rows="3"
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                placeholder="Short description for admins and candidates"
              />
            </label>

            {assessmentForm.type === 'Practice Test' ? (
              <div className="block">
                <span className="text-sm font-semibold text-slate-200">Practice Test Sections / Categories Included</span>
                <div className="mt-3 flex flex-wrap gap-4">
                  {['Coding', 'Aptitude', 'Verbal', 'Reasoning', 'Advanced Aptitude'].map((cat) => {
                    const currentTopics = assessmentForm.topics ? assessmentForm.topics.split(',').map(t => t.trim()) : []
                    const checked = currentTopics.includes(cat)
                    return (
                      <label key={cat} className="inline-flex items-center gap-2 cursor-pointer bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 hover:border-cyan-400 transition">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            let nextTopics = [...currentTopics]
                            if (e.target.checked) {
                              if (!nextTopics.includes(cat)) nextTopics.push(cat)
                            } else {
                              nextTopics = nextTopics.filter(t => t !== cat)
                            }
                            setAssessmentForm(current => ({ ...current, topics: nextTopics.join(', ') }))
                          }}
                          className="rounded text-cyan-500 focus:ring-cyan-500/20 bg-slate-950 border-slate-700"
                        />
                        <span className="text-sm text-slate-200">{cat}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ) : (
              <label className="block">
                <span className="text-sm font-semibold text-slate-200">Topics</span>
                <input
                  type="text"
                  value={assessmentForm.topics}
                  onChange={(event) => setAssessmentForm((current) => ({ ...current, topics: event.target.value }))}
                  placeholder="Comma-separated topics"
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                />
              </label>
            )}

            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">Question Builder</h3>
                  <p className="text-xs text-slate-500">Optional question placeholders for this assessment.</p>
                </div>
                <button
                  type="button"
                  onClick={addQuestionDraft}
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-400"
                >
                  <Plus className="h-4 w-4" /> Add Question
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {questionDrafts.map((question, index) => (
                  <div key={question.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">Question {index + 1}</div>
                        <div className="text-xs text-slate-500">Optional template content only.</div>
                      </div>
                      {questionDrafts.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeQuestionDraft(index)}
                          className="rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-4 grid gap-4">
                      <label className="block">
                        <span className="text-xs font-semibold text-slate-400">Question text</span>
                        <textarea
                          rows="2"
                          value={question.text}
                          onChange={(event) => updateQuestionDraft(index, 'text', event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                          placeholder="Write the question prompt"
                        />
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {question.options.map((option, optionIndex) => (
                          <label key={optionIndex} className="block">
                            <span className="text-xs font-semibold text-slate-400">Option {optionIndex + 1}</span>
                            <input
                              type="text"
                              value={option}
                              onChange={(event) => {
                                const nextOptions = [...question.options]
                                nextOptions[optionIndex] = event.target.value
                                updateQuestionDraft(index, 'options', nextOptions)
                              }}
                              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                              placeholder={`Option ${optionIndex + 1}`}
                            />
                          </label>
                        ))}
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <label className="block">
                          <span className="text-xs font-semibold text-slate-400">Correct answer</span>
                          <select
                            value={question.correctAnswer}
                            onChange={(event) => updateQuestionDraft(index, 'correctAnswer', Number(event.target.value))}
                            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                          >
                            {question.options.map((_, optionIndex) => (
                              <option key={optionIndex} value={optionIndex}>Option {optionIndex + 1}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-xs font-semibold text-slate-400">Marks</span>
                          <input
                            type="number"
                            min="1"
                            value={question.marks}
                            onChange={(event) => updateQuestionDraft(index, 'marks', event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                          />
                        </label>
                        {assessmentForm.type === 'Practice Test' ? (
                          <label className="block">
                            <span className="text-xs font-semibold text-slate-400">Category / Section</span>
                            <select
                              value={question.category || 'Aptitude'}
                              onChange={(event) => updateQuestionDraft(index, 'category', event.target.value)}
                              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                            >
                              <option value="Coding">Coding</option>
                              <option value="Aptitude">Aptitude</option>
                              <option value="Verbal">Verbal</option>
                              <option value="Reasoning">Reasoning</option>
                              <option value="Advanced Aptitude">Advanced Aptitude</option>
                            </select>
                          </label>
                        ) : (
                          <label className="block">
                            <span className="text-xs font-semibold text-slate-400">Topic</span>
                            <input
                              type="text"
                              value={question.topic}
                              onChange={(event) => updateQuestionDraft(index, 'topic', event.target.value)}
                              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                              placeholder="Optional topic"
                            />
                          </label>
                        )}
                      </div>
                      <label className="block">
                        <span className="text-xs font-semibold text-slate-400">Explanation</span>
                        <textarea
                          rows="2"
                          value={question.explanation}
                          onChange={(event) => updateQuestionDraft(index, 'explanation', event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                          placeholder="Optional explanation"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">Upload Questions PDF</h3>
                  <p className="text-xs text-slate-500">Upload a PDF to auto-parse multiple choice questions.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="pdf-upload"
                    type="file"
                    accept="application/pdf"
                    onChange={async (e) => {
                      const file = e.target.files && e.target.files[0]
                      setPdfParseError(null)
                      setParsedQuestions([])
                      if (!file) return
                      setUploadedPdf(file)
                      const form = new FormData()
                      form.append('file', file)
                      setPdfParsing(true)
                      try {
                        const resp = await api.post('/api/admin/assessments/upload-pdf', form, { headers: { 'Content-Type': 'multipart/form-data' } })
                        const qs = resp.data.data?.questions || resp.data.questions || []
                        setParsedQuestions(qs)
                        if (qs.length) {
                          // merge parsed questions into drafts for review
                          const nextDrafts = qs.map((q) => {
                            const isCoding = q.type === 'coding' || q.topic === 'Coding' || q.category === 'Coding';
                            return {
                              id: String(Date.now()) + Math.random().toString(36).slice(2, 6),
                              text: q.text || q.question || '',
                              options: q.options && q.options.length ? q.options : (isCoding ? [] : ['', '', '', '']),
                              correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
                              topic: q.topic || '',
                              category: q.category || q.topic || '',
                              marks: q.marks || '1',
                              explanation: q.explanation || '',
                            };
                          })
                          setQuestionDrafts((current) => [...current, ...nextDrafts])
                        } else {
                          setPdfParseError('No questions were parsed from the PDF. Please verify the file format.')
                        }
                      } catch (err) {
                        const msg = err?.response?.data?.message || err?.message || 'Upload failed'
                        setPdfParseError(msg)
                      } finally {
                        setPdfParsing(false)
                      }
                    }}
                    className="hidden"
                  />
                  <label htmlFor="pdf-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-cyan-500 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-400">
                    {pdfParsing ? 'Parsing...' : 'Upload PDF'}
                  </label>
                </div>
              </div>

              {pdfParseError ? (
                <div className="mt-3 text-sm text-rose-400">{pdfParseError}</div>
              ) : null}

              {parsedQuestions.length ? (
                <div className="mt-4 space-y-2">
                  <div className="text-xs text-slate-400">Parsed questions added to the builder (you can edit or remove them below).</div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-800 px-6 py-5 sm:flex-row sm:justify-end sm:px-7">
            <button
              type="button"
              onClick={() => setAssessmentModalOpen(false)}
              className="rounded-2xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveAssessment}
              disabled={assessmentFormSaving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-950/30 transition hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {assessmentFormSaving ? 'Saving...' : editingAssessment ? 'Save Changes' : 'Create Assessment'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderAssessments = () => {
    const summary = assessmentSummary || buildLocalAssessmentSummary(assessmentUsers)
    const totalPages = Math.max(1, Math.ceil(assessmentTotal / assessmentPageSize))
    const firstVisibleUser = assessmentTotal
      ? ((assessmentPage - 1) * assessmentPageSize) + 1
      : 0
    const lastVisibleUser = Math.min(assessmentPage * assessmentPageSize, assessmentTotal)

    return (
      <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 text-white shadow-2xl shadow-slate-950/20">
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_35%),linear-gradient(135deg,#020617_0%,#0f172a_100%)] p-6 sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 text-cyan-300">
                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3">
                  <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.24em]">Centralized permissions</p>
              </div>
              <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">Assessment Management</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                Manage every assessment permission from one workspace. Changes save as soon as a switch is updated.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => bulkUpdateAssessmentAccess(true)}
                disabled={bulkAssessmentUpdating}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-950/40 hover:from-cyan-400 hover:to-blue-500 disabled:cursor-wait disabled:opacity-60"
              >
                {bulkAssessmentUpdating && <LoaderCircle className="h-4 w-4 animate-spin" />}
                Grant Access To All
              </button>
              <button
                type="button"
                onClick={() => bulkUpdateAssessmentAccess(false)}
                disabled={bulkAssessmentUpdating}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm font-bold text-rose-200 hover:bg-rose-400/20 disabled:cursor-wait disabled:opacity-60"
              >
                Revoke All Access
              </button>
            </div>
          </div>
        </section>

        <div className="space-y-8 p-4 sm:p-6 lg:p-8">
          <section aria-labelledby="assessment-types-title">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Section A</p>
                <h3 id="assessment-types-title" className="mt-2 text-xl font-bold">Assessment Types</h3>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400">
                <Users className="h-3.5 w-3.5" />
                {summary.totalUsers || assessmentTotal} total users
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              {assessmentOptions.map((assessment, index) => {
                const Icon = assessment.icon
                const details = summary.assessments?.[assessment.key] || {
                  usersWithAccess: 0,
                  active: false,
                }

                return (
                  <motion.article
                    key={assessment.key}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-5"
                  >
                    <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${assessment.accent}`} />
                    <div className="flex items-start justify-between gap-4">
                      <div className={`rounded-xl bg-gradient-to-br ${assessment.accent} p-2.5 text-slate-950 shadow-lg`}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                        details.active
                          ? 'bg-emerald-400/10 text-emerald-300'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {details.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <h4 className="mt-5 font-bold text-slate-100">{assessment.title}</h4>
                    <p className="mt-2 min-h-[2.5rem] text-sm leading-5 text-slate-500">{assessment.description}</p>
                    <div className="mt-5 border-t border-white/10 pt-4">
                      <div className="text-2xl font-bold text-white">{details.usersWithAccess || 0}</div>
                      <div className="text-xs text-slate-500">users with access</div>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          </section>

          <section aria-labelledby="assessment-management-list-title" className="rounded-2xl border border-white/10 bg-slate-900/70">
            <div className="border-b border-white/10 p-4 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Section B</p>
                  <h3 id="assessment-management-list-title" className="mt-2 text-xl font-bold">Assessment Catalog</h3>
                  <p className="mt-1 text-sm text-slate-500">Create, activate, and manage the assessments available to candidates.</p>
                </div>
                <button
                  type="button"
                  onClick={openCreateAssessmentModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-950/40 hover:from-cyan-400 hover:to-blue-500"
                >
                  <Plus className="h-4 w-4" />
                  Create Assessment
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {assessmentListLoading ? (
                <div className="flex min-h-[14rem] items-center justify-center text-slate-400">
                  <LoaderCircle className="h-5 w-5 animate-spin text-cyan-300" />
                  <span className="ml-3">Loading assessments...</span>
                </div>
              ) : assessmentList.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-white/10 bg-slate-950/60 text-left text-[11px] uppercase tracking-[0.16em] text-slate-500">
                      <tr>
                        <th className="px-5 py-4 font-semibold">Title</th>
                        <th className="px-5 py-4 font-semibold">Type</th>
                        <th className="px-5 py-4 font-semibold">Difficulty</th>
                          <th className="px-5 py-4 font-semibold">Questions</th>
                        <th className="px-5 py-4 font-semibold">Status</th>
                        <th className="px-5 py-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {assessmentList.map((assessment) => (
                        <tr key={assessment._id || assessment.id} className="hover:bg-white/[0.025]">
                          <td className="px-5 py-4 font-semibold text-slate-100">
                            {assessment.title || 'Untitled'}
                          </td>
                          <td className="px-5 py-4 text-slate-400">
                            {assessmentOptions.find((option) => option.key === assessment.accessKey)?.shortTitle || assessment.accessKey || assessment.category || '—'}
                          </td>
                          <td className="px-5 py-4 text-slate-400 capitalize">{assessment.difficulty || 'medium'}</td>
                          <td className="px-5 py-4 text-slate-400">{assessment.count ?? '—'}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${assessment.active ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                              {assessment.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => openEditAssessmentModal(assessment)}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                              >
                                <Edit3 className="h-4 w-4" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleAssessmentActive(assessment)}
                                className="inline-flex items-center rounded-full border border-slate-700 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                              >
                                {assessment.active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAssessment(assessment)}
                                className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/20"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex min-h-[14rem] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/90 p-10 text-center text-slate-400">
                  <div className="mb-4 text-2xl">No assessments yet</div>
                  <div className="text-sm">Use the button above to create your first assessment.</div>
                </div>
              )}
            </div>
          </section>

          <section aria-labelledby="user-access-title" className="rounded-2xl border border-white/10 bg-slate-900/70">
            <div className="border-b border-white/10 p-4 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Section B</p>
                  <h3 id="user-access-title" className="mt-2 text-xl font-bold">User Access Control</h3>
                  <p className="mt-1 text-sm text-slate-500">Search users and update individual assessment permissions.</p>
                </div>
                <label className="relative block w-full lg:max-w-sm">
                  <span className="sr-only">Search users</span>
                  <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="search"
                    value={assessmentSearch}
                    onChange={(event) => {
                      setAssessmentSearch(event.target.value)
                      setAssessmentPage(1)
                    }}
                    placeholder="Search by name or email"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                  />
                </label>
              </div>
            </div>

            {assessmentLoading ? (
              <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-400">
                <LoaderCircle className="h-5 w-5 animate-spin text-cyan-300" />
                Loading users...
              </div>
            ) : assessmentUsers.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-white/10 bg-slate-950/60 text-left text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Name</th>
                      <th className="px-5 py-4 font-semibold">Email</th>
                      <th className="px-5 py-4 font-semibold">Role</th>
                      <th className="min-w-[36rem] px-5 py-4 font-semibold">Assessment Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {assessmentUsers.map((user) => (
                      <tr key={user._id || user.id} className="hover:bg-white/[0.025]">
                        <td className="px-5 py-4 font-semibold text-slate-100">{user.name}</td>
                        <td className="px-5 py-4 text-slate-400">{user.email}</td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">{renderUserAssessmentControls(user)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
                <div className="rounded-2xl bg-white/5 p-4 text-slate-500">
                  <Users className="h-6 w-6" />
                </div>
                <div className="mt-4 font-semibold text-slate-200">No users found</div>
                <div className="mt-1 text-sm text-slate-500">Try a different name or email address.</div>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="text-slate-500">
                Showing {firstVisibleUser}-{lastVisibleUser} of {assessmentTotal}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAssessmentPage((current) => Math.max(1, current - 1))}
                  disabled={assessmentPage <= 1 || assessmentLoading}
                  className="rounded-lg border border-slate-700 px-3 py-2 font-semibold text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-2 text-xs font-semibold text-slate-500">
                  Page {assessmentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setAssessmentPage((current) => Math.min(totalPages, current + 1))}
                  disabled={assessmentPage >= totalPages || assessmentLoading}
                  className="rounded-lg border border-slate-700 px-3 py-2 font-semibold text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  }

  const renderQuestions = () => (
    <div className="grid gap-4 lg:grid-cols-2">
      {loading ? (
        Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32" />)
      ) : data.questions.length ? data.questions.map((question) => (
        <article key={question._id || question.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{question.module || question.category || 'content'}</div>
          <h3 className="mt-2 font-semibold text-slate-900">{question.title || question.question || question.text}</h3>
          <p className="mt-2 text-sm text-slate-600">{question.prompt || question.explanation || 'Managed content item'}</p>
        </article>
      )) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 lg:col-span-2">
          No questions found.
        </div>
      )}
    </div>
  )

  const renderInterviews = () => (
    <div className="space-y-4">
      {loading ? (
        Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24" />)
      ) : data.interviews.length ? data.interviews.map((session) => (
        <div key={session._id || session.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-900">{session.role}</div>
              <div className="text-sm text-slate-500">{session.interviewType} · {session.status}</div>
            </div>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{session.durationSeconds || 0}s</span>
          </div>
        </div>
      )) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          No interview reports yet.
        </div>
      )}
    </div>
  )

  const formatDate = (d) => {
    if (!d) return '-'
    try {
      const date = new Date(d)
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    } catch (e) {
      return String(d)
    }
  }

  const renderLeaderboard = () => {
    const list = data.leaderboard || []
    if (!list.length) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          No leaderboard activity yet.
        </div>
      )
    }

    return (
      <div className="overflow-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="py-2 px-3 text-left">Rank</th>
              <th className="py-2 px-3 text-left">Name</th>
              <th className="py-2 px-3 text-left">XP</th>
              <th className="py-2 px-3 text-left">Level</th>
              <th className="py-2 px-3 text-left">Streak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((entry, idx) => (
              <tr key={entry.userId || entry.id || idx} className="hover:bg-slate-50">
                <td className="py-3 px-3 text-slate-700">#{entry.rank || idx + 1}</td>
                <td className="py-3 px-3 font-semibold text-slate-900">{entry.name || entry.username || entry.displayName || 'Unknown'}</td>
                <td className="py-3 px-3 text-slate-700">{entry.xp || 0}</td>
                <td className="py-3 px-3 text-slate-700">{entry.level || entry.levelName || '-'}</td>
                <td className="py-3 px-3 text-slate-700">{entry.streak || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderTopUsers = () => {
    const top = data.users?.slice(0, 10) || []
    if (loading) {
      return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
    }

    if (!top.length) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No users found.</div>
      )
    }

    return (
      <div className="overflow-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="py-2 px-3 text-left">Name</th>
              <th className="py-2 px-3 text-left">Email</th>
              <th className="py-2 px-3 text-left">XP</th>
              <th className="py-2 px-3 text-left">Level</th>
              <th className="py-2 px-3 text-left">Interviews</th>
              <th className="py-2 px-3 text-left">Coding Attempts</th>
              <th className="py-2 px-3 text-left">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {top.map((u) => (
              <tr key={u._id || u.id} className="hover:bg-slate-50">
                <td className="py-3 px-3 font-semibold text-slate-900">{u.name || '—'}</td>
                <td className="py-3 px-3 text-slate-700 truncate max-w-[200px]">{u.email || '—'}</td>
                <td className="py-3 px-3 text-slate-700">{u.xp || 0}</td>
                <td className="py-3 px-3 text-slate-700">{u.level || '-'}</td>
                <td className="py-3 px-3 text-slate-700">{u.interviews || u.interviewCount || 0}</td>
                <td className="py-3 px-3 text-slate-700">{u.codingAttempts || u.codingCount || 0}</td>
                <td className="py-3 px-3 text-slate-700">{formatDate(u.createdAt || u.joinedAt || u.registeredAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderAnalyticsSummary = () => {
    const s = data.summary || {}
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Analytics Summary</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Users</div>
            <div className="text-xl font-bold text-slate-900">{s.userCount ?? '-'}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Active</div>
            <div className="text-xl font-bold text-slate-900">{s.activeUserCount ?? '-'}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Questions</div>
            <div className="text-xl font-bold text-slate-900">{(s.questionCount || 0) + (s.aiQuestionCount || 0)}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-500">Sessions</div>
            <div className="text-xl font-bold text-slate-900">{s.interviewCount ?? '-'}</div>
          </div>
        </div>
      </div>
    )
  }

  const renderReports = () => (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">{renderAnalyticsSummary()}</div>
        <div>{renderLeaderboard()}</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>{renderTopUsers()}</div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">User Statistics</h3>
          <div className="space-y-3 text-sm text-slate-700">
            <div>Average XP: <strong className="text-slate-900">{data.summary?.averageXp ?? '—'}</strong></div>
            <div>Average Attempts: <strong className="text-slate-900">{data.summary?.averageAttempts ?? '—'}</strong></div>
            <div>Retention (30d): <strong className="text-slate-900">{data.summary?.retention30d ?? '—'}</strong></div>
            <div>Active Today: <strong className="text-slate-900">{data.summary?.activeToday ?? '—'}</strong></div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-8 relative">
      <LoadingOverlay
        visible={loading}
        title="Loading admin dashboard"
        subtitle="Gathering platform and user analytics for administrators."
      />
      <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#020617_0%,#0f172a_55%,#1f2937_100%)] px-6 py-8 text-white shadow-2xl sm:px-8 lg:px-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.28em] text-sky-300">Stage 4 Admin</p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{t('admin.title')}</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">{t('admin.subtitle')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="rounded-full border border-white/30 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="self-start rounded-[1.5rem] border border-slate-800 bg-slate-950 p-3 text-white shadow-xl lg:sticky lg:top-24">
          <div className="px-3 pb-3 pt-2">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Admin workspace</div>
            <div className="mt-1 text-sm text-slate-400">Management tools</div>
          </div>
          <nav aria-label="Admin sections" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-950/30'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">
          {error ? <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'assessments' && renderAssessments()}
          {activeTab === 'questions' && renderQuestions()}
          {activeTab === 'interviews' && renderInterviews()}
          {activeTab === 'reports' && renderReports()}
          {renderAssessmentModal()}
        </main>
      </div>
    </div>
  )
}
