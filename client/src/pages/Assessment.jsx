import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BrainCircuit,
  Calculator,
  Code2,
  MessagesSquare,
  Sparkles,
  Target,
} from 'lucide-react'

const assessments = [
  {
    title: 'Technical Assessment',
    description:
      'Evaluate core computer science concepts, problem-solving skills, and technical fundamentals.',
    difficulty: 'Advanced',
    icon: BrainCircuit,
    href: '/quiz?module=reasoning&count=10&difficulty=hard',
    accent: 'from-cyan-400 to-blue-500',
    badge: 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/20',
  },
  {
    title: 'Aptitude Assessment',
    description:
      'Practice quantitative aptitude, logical reasoning, and verbal ability in a focused test format.',
    difficulty: 'Intermediate',
    icon: Calculator,
    href: '/quiz?module=aptitude&count=10',
    accent: 'from-violet-400 to-fuchsia-500',
    badge: 'bg-violet-400/10 text-violet-300 ring-violet-400/20',
  },
  {
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
          {assessments.map((assessment) => {
            const Icon = assessment.icon

            return (
              <motion.article
                key={assessment.title}
                variants={cardVariants}
                whileHover={{ y: -6 }}
                className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/10 backdrop-blur-sm transition-colors duration-300 hover:border-slate-700 sm:p-7"
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

                <div className="mt-7 flex flex-col gap-4 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Target className="h-4 w-4" aria-hidden="true" />
                    Skill focused
                  </div>
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
                </div>
              </motion.article>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
