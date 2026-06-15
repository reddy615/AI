import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BrainCircuit,
  Calculator,
  Code2,
  LoaderCircle,
  LockKeyhole,
  MessagesSquare,
  Sparkles,
  Target,
} from 'lucide-react'
import api from '../api/api'

const emptyAssessmentAccess = {
  technical: false,
  aptitude: false,
  coding: false,
  mockInterview: false,
  'Practice Test': false,
}

const staticAssessments = [
  {
    accessKey: 'mockInterview',
    title: 'Mock Interview Assessment',
    description:
      'Build interview confidence with role-focused questions and structured performance feedback.',
    difficulty: 'Intermediate',
    icon: MessagesSquare,
    href: '/interview',
    accent: 'from-amber-300 to-orange-500',
    badge: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
  },
  {
    accessKey: 'coding',
    title: 'Coding Challenge Assessment',
    description:
      'Solve timed programming challenges designed to test implementation and algorithmic thinking.',
    difficulty: 'Advanced',
    icon: Code2,
    href: '/coding',
    accent: 'from-emerald-400 to-teal-500',
    badge: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
  },
]

const assessmentMeta = {
  technical: {
    icon: BrainCircuit,
    accent: 'from-cyan-400 to-blue-500',
    badge: 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/20',
  },
  aptitude: {
    icon: Calculator,
    accent: 'from-violet-400 to-fuchsia-500',
    badge: 'bg-violet-400/10 text-violet-300 ring-violet-400/20',
  },
  'Practice Test': {
    icon: BrainCircuit,
    accent: 'from-pink-400 to-rose-500',
    badge: 'bg-pink-400/10 text-pink-300 ring-pink-400/20',
  },
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
}

export default function Assessment() {
  const user = useSelector((state) => state.auth.user)
  const [accessState, setAccessState] = useState({
    permissions: {
      ...emptyAssessmentAccess,
      ...(user?.assessmentAccess || {}),
    },
    isAdmin: user?.role === 'admin',
    loading: true,
  })
  const [activeAssessments, setActiveAssessments] = useState([])
  const [assessmentsLoading, setAssessmentsLoading] = useState(true)

  useEffect(() => {
    let active = true

    const loadAssessmentAccess = async () => {
      try {
        const response = await api.get('/api/profile/assessment-access')
        const payload = response.data?.data || response.data

        if (active) {
          setAccessState({
            permissions: {
              ...emptyAssessmentAccess,
              ...(payload?.assessmentAccess || {}),
            },
            isAdmin: payload?.isAdmin === true,
            loading: false,
          })
        }
      } catch {
        if (active) {
          setAccessState((current) => ({ ...current, loading: false }))
        }
      }
    }

    const loadActiveAssessments = async () => {
      try {
        const response = await api.get('/api/assessments')
        const payload = response.data?.data || response.data
        const items = Array.isArray(payload?.assessments) ? payload.assessments : []

        if (active) {
          setActiveAssessments(items)
        }
      } catch {
        if (active) {
          setActiveAssessments([])
        }
      } finally {
        if (active) {
          setAssessmentsLoading(false)
        }
      }
    }

    loadAssessmentAccess()
    loadActiveAssessments()

    return () => {
      active = false
    }
  }, [])

  const buildAssessmentCard = (assessment) => {
    const meta = assessmentMeta[assessment.accessKey] || {
      icon: Target,
      accent: 'from-slate-500 to-slate-700',
      badge: 'bg-slate-500/10 text-slate-300 ring-slate-500/20',
    }

    const moduleName = assessment.module || 'reasoning'
    const count = assessment.count || 10
    const difficulty = assessment.difficulty ? assessment.difficulty.charAt(0).toUpperCase() + assessment.difficulty.slice(1) : 'Intermediate'
    let href = `/quiz?module=${encodeURIComponent(moduleName)}&count=${encodeURIComponent(count)}${assessment.difficulty ? `&difficulty=${encodeURIComponent(assessment.difficulty)}` : ''}`

    if (assessment.accessKey === 'mockInterview') {
      href = '/interview'
    } else if (assessment.accessKey === 'coding') {
      href = '/coding'
    } else if (assessment.accessKey === 'Practice Test' || (assessment.questions && assessment.questions.length > 0)) {
      href = `/quiz?assessmentId=${assessment._id}`
    }

    return {
      id: assessment._id,
      accessKey: assessment.accessKey,
      title: assessment.title,
      description: assessment.description || 'Practice this assessment to sharpen your skills.',
      difficulty,
      icon: meta.icon,
      href,
      accent: meta.accent,
      badge: meta.badge,
    }
  }

  const renderedAssessments = [
    ...activeAssessments.map(buildAssessmentCard),
    ...staticAssessments,
  ]

  return (
    <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-slate-950 px-4 pb-20 pt-12 text-white sm:px-6 sm:pt-16 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10rem] top-20 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-[-8rem] top-48 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-sm font-medium text-cyan-300">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Test your readiness
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Assessment Center
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            Practice technical, aptitude, and interview-focused assessments to evaluate your
            preparation level.
          </p>
        </motion.header>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-5 md:grid-cols-2"
          aria-label="Available assessments"
        >
          {renderedAssessments.map((assessment) => {
            const Icon = assessment.icon
            const hasAccess = accessState.isAdmin || accessState.permissions[assessment.accessKey]

            return (
              <motion.article
                key={assessment.title}
                variants={cardVariants}
                whileHover={{ y: -6 }}
                className={`group relative overflow-hidden rounded-2xl border bg-slate-900/70 p-6 shadow-xl shadow-black/10 backdrop-blur-sm transition-colors duration-300 sm:p-7 ${hasAccess ? 'border-slate-800 hover:border-slate-700' : 'border-rose-400/20'}`}
              >
                <div
                  className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${assessment.accent} opacity-70`}
                />
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${assessment.accent} text-slate-950 shadow-lg`}
                  >
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${assessment.badge}`}
                  >
                    {assessment.difficulty}
                  </span>
                </div>

                <div className="mt-7">
                  <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    {assessment.title}
                  </h2>
                  <p className="mt-3 min-h-[3.5rem] text-sm leading-6 text-slate-400 sm:text-base">
                    {assessment.description}
                  </p>
                </div>

                {!accessState.loading && !hasAccess ? (
                  <div className="mt-6 rounded-2xl border border-rose-400/15 bg-rose-400/5 p-4">
                    <div className="flex items-center gap-2 font-semibold text-rose-300">
                      <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                      Assessment Access Restricted
                    </div>
                    <p className="mt-2 text-sm leading-5 text-slate-400">
                      You currently do not have access to this assessment. Please contact the administrator.
                    </p>
                  </div>
                ) : null}

                <div className="mt-7 flex flex-col gap-4 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    {hasAccess ? (
                      <>
                        <Target className="h-4 w-4" aria-hidden="true" />
                        Skill focused
                      </>
                    ) : (
                      <>
                        <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                        Admin approval required
                      </>
                    )}
                  </div>
                  {accessState.loading ? (
                    <button
                      type="button"
                      disabled
                      className="inline-flex cursor-wait items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-400"
                    >
                      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Checking Access
                    </button>
                  ) : hasAccess ? (
                    <Link
                      to={assessment.href}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition-all duration-200 hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                      Start Assessment
                      <ArrowRight
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-500"
                    >
                      <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                      Start Assessment
                    </button>
                  )}
                </div>
              </motion.article>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
