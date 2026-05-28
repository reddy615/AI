import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Award,
  BadgeCheck,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  Lightbulb,
  TrendingUp,
  Radar as RadarIcon,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from 'recharts'
import { analyticsMotif, buildAptitudeAnalytics, supportedTopicIcons } from './analytics'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 22, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1 },
}

function metricTone(accuracy) {
  if (accuracy >= 90) return 'from-emerald-400 to-cyan-300'
  if (accuracy >= 75) return 'from-sky-400 to-blue-300'
  if (accuracy >= 60) return 'from-amber-400 to-orange-300'
  return 'from-rose-400 to-fuchsia-300'
}

function qualityLabel(accuracy) {
  if (accuracy >= 90) return 'Precision Mode'
  if (accuracy >= 75) return 'Strong Signal'
  if (accuracy >= 60) return 'In the Zone'
  return 'Foundation Build'
}

function CircularProgressRing({ value, label, subtitle, tone }) {
  const radius = 82
  const stroke = 12
  const normalizedRadius = radius - stroke * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div className="relative flex items-center justify-center">
      <svg width={radius * 2} height={radius * 2} className="-rotate-90 overflow-visible">
        <defs>
          <linearGradient id="accuracy-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="45%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
        <circle
          stroke="rgba(255,255,255,0.12)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <motion.circle
          stroke="url(#accuracy-ring)"
          fill="transparent"
          strokeLinecap="round"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className={`bg-gradient-to-r ${tone} bg-clip-text text-5xl font-black tracking-tight text-transparent`}>
          {value}%
        </div>
        <div className="mt-2 text-sm uppercase tracking-[0.3em] text-white/65">{label}</div>
        <div className="mt-1 max-w-[14rem] text-sm text-white/60">{subtitle}</div>
      </div>
    </div>
  )
}

function MetricChip({ label, value, icon: Icon, tone = 'from-white/15 to-white/5' }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${tone} px-4 py-3 shadow-lg backdrop-blur-xl`}>
      <div className="flex items-center gap-3">
        {Icon ? <Icon className="h-4 w-4 text-cyan-300" /> : null}
        <div className="text-xs uppercase tracking-[0.24em] text-white/55">{label}</div>
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  )
}

function Sparkline({ points = [], stroke = '#22d3ee', fill = 'rgba(34,211,238,0.18)' }) {
  const width = 120
  const height = 40
  const normalized = points.length > 1 ? points : [0, 20, 35, 55, 70]
  const max = Math.max(...normalized, 1)
  const min = Math.min(...normalized, 0)
  const span = Math.max(max - min, 1)
  const stepX = width / Math.max(normalized.length - 1, 1)
  const linePoints = normalized.map((point, index) => {
    const x = index * stepX
    const y = height - ((point - min) / span) * (height - 4)
    return [x, y]
  })
  const path = linePoints.reduce((acc, [x, y], index) => `${acc}${index === 0 ? 'M' : 'L'}${x},${y}`, '')
  const area = `${path} L ${width},${height} L 0,${height} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-10 w-full">
      <path d={area} fill={fill} />
      <path d={path} fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TopicAnalyticsCard({ topic }) {
  const Icon = topic.icon || BrainCircuit
  const tone = metricTone(topic.accuracy)

  return (
    <motion.article
      variants={itemVariants}
      whileHover={{ y: -8, scale: 1.01 }}
      className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/6 p-5 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.95)] backdrop-blur-xl transition-all duration-300"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${tone} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-10`} />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-cyan-200 shadow-lg">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-white/45">Topic</div>
            <h3 className="mt-1 text-lg font-semibold text-white">{topic.topic}</h3>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-medium text-white/70">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
              {qualityLabel(topic.accuracy)}
            </div>
          </div>
        </div>
        <div className={`rounded-2xl bg-gradient-to-br ${tone} px-3 py-2 text-right shadow-lg`}>
          <div className="text-[11px] uppercase tracking-[0.28em] text-white/75">Accuracy</div>
          <div className="text-2xl font-black text-white">{topic.accuracy}%</div>
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-[1fr_auto] gap-4">
        <div>
          <div className="flex items-center justify-between text-sm text-white/60">
            <span>Score</span>
            <span className="font-semibold text-white">{topic.score}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${tone}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(topic.accuracy, 6)}%` }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-white/70">
            <div className="rounded-xl bg-white/5 px-2.5 py-2 text-center">
              <div className="font-semibold text-white">{topic.correct}</div>
              <div>Correct</div>
            </div>
            <div className="rounded-xl bg-white/5 px-2.5 py-2 text-center">
              <div className="font-semibold text-white">{topic.wrong}</div>
              <div>Wrong</div>
            </div>
            <div className="rounded-xl bg-white/5 px-2.5 py-2 text-center">
              <div className="font-semibold text-white">{topic.skipped}</div>
              <div>Skipped</div>
            </div>
          </div>
        </div>
        <div className="flex w-32 flex-col items-end justify-between">
          <Sparkline points={topic.sparkline} stroke={topic.accuracy >= 80 ? '#22d3ee' : topic.accuracy >= 60 ? '#f59e0b' : '#fb7185'} fill={topic.accuracy >= 80 ? 'rgba(34,211,238,0.2)' : topic.accuracy >= 60 ? 'rgba(245,158,11,0.16)' : 'rgba(251,113,133,0.18)'} />
          <div className="text-right text-xs text-white/45">{topic.total} questions</div>
        </div>
      </div>
    </motion.article>
  )
}

function SectionHeading({ eyebrow, title, subtitle, icon: Icon }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.32em] text-cyan-300/85">
          {Icon ? <Icon className="h-4 w-4" /> : null}
          <span>{eyebrow}</span>
        </div>
        <h2 className="mt-2 text-2xl font-bold text-white">{title}</h2>
        {subtitle ? <p className="mt-1 max-w-3xl text-sm text-white/58">{subtitle}</p> : null}
      </div>
    </div>
  )
}

function ChartShell({ title, subtitle, children, icon: Icon, className = '' }) {
  return (
    <motion.div variants={itemVariants} className={`rounded-[1.75rem] border border-white/10 bg-white/6 p-5 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur-xl ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-white/45">
            {Icon ? <Icon className="h-4 w-4 text-cyan-300" /> : null}
            <span>{title}</span>
          </div>
          {subtitle ? <p className="mt-1 text-sm text-white/58">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </motion.div>
  )
}

function InsightsCard({ icon: Icon, title, description, tone = 'from-cyan-400/20 to-violet-400/10' }) {
  return (
    <div className={`rounded-[1.25rem] border border-white/10 bg-gradient-to-br ${tone} p-4`}>
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/8 p-3 text-white shadow-lg">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="text-xs text-white/58">{description}</div>
        </div>
      </div>
    </div>
  )
}

function BadgePill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-medium text-white/75">
      {children}
    </span>
  )
}

export function AptitudeResultAnalytics({ attempt, analytics, history = [], gamification = null, onBack, module }) {
  const [showAnswers, setShowAnswers] = useState(false)
  const assessmentModule = (module || attempt?.module || 'aptitude').toLowerCase()
  const moduleLabel = assessmentModule === 'reasoning' ? 'Reasoning' : assessmentModule === 'verbal' ? 'Verbal' : 'Aptitude'

  const model = useMemo(() => buildAptitudeAnalytics({ attempt, analytics, history, gamification }), [attempt, analytics, history, gamification])

  const answerList = Array.isArray(attempt?.answers) ? attempt.answers : []
  const overallProgress = model.accuracy

  if (!attempt) return null

  return (
    <div className={`relative isolate overflow-hidden rounded-[2.5rem] ${analyticsMotif.heroGlow} p-[1px] shadow-[0_45px_120px_-55px_rgba(56,189,248,0.7)]`}>
      <div className="absolute inset-0 opacity-70">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl" />
      </div>

      <div className="relative rounded-[2.45rem] border border-white/10 bg-slate-950/92 p-4 text-white sm:p-6 lg:p-8">
        <motion.div className="mx-auto flex max-w-7xl flex-col gap-6" variants={containerVariants} initial="hidden" animate="show">
          <motion.div variants={itemVariants} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-[0.32em] text-cyan-300/85">{moduleLabel} Intelligence</div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{moduleLabel} Result Analytics</h1>
              <p className="max-w-3xl text-sm text-white/60 sm:text-base">A luxury, AI-style performance breakdown with topic intelligence, charts, insights, and answer review.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAnswers((current) => !current)}
                className="rounded-full border border-white/15 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/12"
              >
                {showAnswers ? 'Hide Answers' : 'View Answers'}
              </button>
              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01]"
                >
                  Back to dashboard
                </button>
              ) : null}
            </div>
          </motion.div>

          <motion.section variants={itemVariants} className={`${analyticsMotif.card} relative overflow-hidden p-5 sm:p-6 lg:p-7`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.15),_transparent_26%)]" />
            <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs uppercase tracking-[0.28em] text-white/65">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                  {qualityLabel(model.accuracy)}
                </div>

                <div className="space-y-3">
                  <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">Score {model.score}</h2>
                  <p className="max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
                    You answered <span className="font-semibold text-white">{model.correct}</span> questions correctly from <span className="font-semibold text-white">{model.totalQuestions}</span> total with a {model.accuracy}% accuracy rate.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricChip label="Correct" value={model.correct} icon={CheckCircle2} tone="from-emerald-500/18 to-emerald-400/8" />
                  <MetricChip label="Wrong" value={model.wrong} icon={Target} tone="from-rose-500/18 to-rose-400/8" />
                  <MetricChip label="Skipped" value={model.skipped} icon={Clock3} tone="from-slate-500/18 to-slate-400/8" />
                  <MetricChip label="Time" value={model.duration} icon={Clock3} tone="from-cyan-500/18 to-blue-400/8" />
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-white/10 bg-white/6 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <CircularProgressRing
                  value={overallProgress}
                  label="Accuracy"
                  subtitle={`Estimated rank: ${model.rankEstimate.label}`}
                  tone={metricTone(model.accuracy)}
                />
                <div className="grid w-full grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/7 px-3 py-3 text-center">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">Rank estimate</div>
                    <div className="mt-1 text-sm font-semibold text-white">{model.rankEstimate.label}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/7 px-3 py-3 text-center">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">XP earned</div>
                    <div className="mt-1 text-sm font-semibold text-white">{model.xpEarned}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className={`${analyticsMotif.panel} p-4`}>
              <div className="text-xs uppercase tracking-[0.24em] text-white/45">Overall accuracy</div>
              <div className="mt-2 text-3xl font-black text-white">{model.accuracy}%</div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div className={`h-full rounded-full bg-gradient-to-r ${metricTone(model.accuracy)}`} initial={{ width: 0 }} animate={{ width: `${model.accuracy}%` }} transition={{ duration: 1.1, ease: 'easeOut' }} />
              </div>
            </div>
            <div className={`${analyticsMotif.panel} p-4`}>
              <div className="text-xs uppercase tracking-[0.24em] text-white/45">Streak</div>
              <div className="mt-2 text-3xl font-black text-white">{model.streak}</div>
              <div className="mt-1 text-sm text-white/58">Best streak: {model.longestStreak || model.streak}</div>
            </div>
            <div className={`${analyticsMotif.panel} p-4`}>
              <div className="text-xs uppercase tracking-[0.24em] text-white/45">Level progress</div>
              <div className="mt-2 text-3xl font-black text-white">Lv {model.level}</div>
              <div className="mt-1 text-sm text-white/58">{model.currentXp}/{model.nextLevelXp} XP</div>
            </div>
            <div className={`${analyticsMotif.panel} p-4`}>
              <div className="text-xs uppercase tracking-[0.24em] text-white/45">Badges</div>
              <div className="mt-2 text-3xl font-black text-white">{model.badges.length}</div>
              <div className="mt-1 text-sm text-white/58">Achievement cards unlocked</div>
            </div>
          </motion.section>

          <section className="grid gap-5 xl:grid-cols-2">
            <ChartShell title="Radar Strength Map" subtitle={`Topic strengths for this ${moduleLabel.toLowerCase()} attempt.`} icon={RadarIcon}>
              <div className="h-80">
                {model.radarData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={model.radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar dataKey="strength" stroke="#22d3ee" fill="rgba(34,211,238,0.35)" fillOpacity={0.55} strokeWidth={2.5} />
                      <Tooltip
                        contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, color: '#fff' }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-[1rem] border border-dashed border-white/10 bg-white/5 text-sm text-white/45">No radar data available yet.</div>
                )}
              </div>
            </ChartShell>

            <ChartShell title="Accuracy Donut" subtitle="Correct, wrong, and skipped distribution." icon={PieChart}>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={model.donutData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={104} paddingAngle={3}>
                      {model.donutData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, color: '#fff' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartShell>

            <ChartShell title="Topic Performance Bars" subtitle="Correct vs wrong vs skipped by topic." icon={BarChart3}>
              <div className="h-80">
                {model.barData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={model.barData} margin={{ left: 0, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="topic" tick={{ fill: '#cbd5e1', fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={56} />
                      <YAxis tick={{ fill: '#cbd5e1', fontSize: 10 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, color: '#fff' }}
                      />
                      <Legend />
                      <Bar dataKey="correct" name="Correct" fill="#22c55e" radius={[10, 10, 0, 0]} />
                      <Bar dataKey="wrong" name="Wrong" fill="#ef4444" radius={[10, 10, 0, 0]} />
                      <Bar dataKey="skipped" name="Skipped" fill="#94a3b8" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-[1rem] border border-dashed border-white/10 bg-white/5 text-sm text-white/45">No topic bars available.</div>
                )}
              </div>
            </ChartShell>

            <ChartShell title="Improvement Trend" subtitle={`Recent ${moduleLabel.toLowerCase()} attempts and performance drift.`} icon={TrendingUp}>
              <div className="h-80">
                {model.trendData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={model.trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="attempt" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, color: '#fff' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="score" name="Score" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="accuracy" name="Accuracy" stroke="#22d3ee" strokeWidth={3} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-[1rem] border border-dashed border-white/10 bg-white/5 text-sm text-white/45">Complete more {moduleLabel.toLowerCase()} attempts to reveal trend lines.</div>
                )}
              </div>
            </ChartShell>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <motion.div variants={itemVariants} className="rounded-[1.75rem] border border-white/10 bg-white/6 p-5 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur-xl">
              <SectionHeading
                eyebrow="AI insights"
                title="Personalized intelligence"
                subtitle="The dashboard detects weak topics, suggests practice sets, and highlights where you are already strong."
                icon={Lightbulb}
              />

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {model.recommendations.map((item, index) => (
                  <InsightsCard
                    key={item.title}
                    icon={index === 0 ? Lightbulb : index === 1 ? BadgeCheck : index === 2 ? Trophy : Sparkles}
                    title={item.title}
                    description={item.description}
                    tone={index === 0 ? 'from-cyan-400/20 to-blue-400/10' : index === 1 ? 'from-emerald-400/20 to-cyan-400/10' : 'from-fuchsia-400/20 to-violet-400/10'}
                  />
                ))}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-[1.25rem] border border-white/10 bg-white/7 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-white/45">Top strength</div>
                  <div className="mt-2 text-base font-semibold text-white">{model.strengthIndicators[0]?.topic || 'Consistency'}</div>
                  <div className="mt-1 text-sm text-white/58">{model.strengthIndicators[0]?.accuracy || 0}% accuracy</div>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-white/7 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-white/45">Weakest topic</div>
                  <div className="mt-2 text-base font-semibold text-white">{model.weakTopics[0]?.topic || 'N/A'}</div>
                  <div className="mt-1 text-sm text-white/58">Focus here next</div>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-white/7 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-white/45">Suggested set</div>
                  <div className="mt-2 text-base font-semibold text-white">{model.suggestedTopics.slice(0, 2).join(' · ') || 'Adaptive practice'}</div>
                  <div className="mt-1 text-sm text-white/58">Smart practice topics</div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="rounded-[1.75rem] border border-white/10 bg-white/6 p-5 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur-xl">
              <SectionHeading
                eyebrow="Gamification"
                title="Momentum & progression"
                subtitle="Track XP, streaks, and achievement badges alongside the quiz result."
                icon={Trophy}
              />

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <MetricChip label="XP earned" value={model.xpEarned} icon={Flame} tone="from-orange-500/20 to-rose-500/10" />
                <MetricChip label="Current XP" value={model.currentXp} icon={Award} tone="from-cyan-500/20 to-blue-500/10" />
                <MetricChip label="Level" value={model.level} icon={BadgeCheck} tone="from-violet-500/20 to-fuchsia-500/10" />
                <MetricChip label="Streak" value={model.streak} icon={Flame} tone="from-emerald-500/20 to-teal-500/10" />
              </div>

              <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-white/7 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-white/45">Rank progression</div>
                    <div className="mt-1 text-lg font-semibold text-white">{model.rankProgress}% to next level</div>
                  </div>
                  <BadgePill>{model.rankEstimate.label}</BadgePill>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div className={`h-full rounded-full bg-gradient-to-r ${model.rankEstimate.tone}`} initial={{ width: 0 }} animate={{ width: `${model.rankProgress}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
                </div>
              </div>

              <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-white/7 p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-white/45">Badges earned</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {model.badges.length ? model.badges.map((badge, index) => (
                    <BadgePill key={`${String(badge)}-${index}`}>{typeof badge === 'string' ? badge : badge?.name || badge?.title || 'Badge'}</BadgePill>
                  )) : (
                    <BadgePill>First steps unlocked</BadgePill>
                  )}
                </div>
              </div>
            </motion.div>
          </section>

          <section className="space-y-4">
            <SectionHeading
              eyebrow="Topic analytics"
              title="18-topic performance grid"
              subtitle="Every topic is shown as a premium card with its own accuracy, score, progress bar, and sparkline."
              icon={RadarIcon}
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {model.topicCards.map((topic) => (
                <TopicAnalyticsCard key={topic.topic} topic={topic} />
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeading
              eyebrow="Answer review"
              title={`View every ${moduleLabel.toLowerCase()} answer`}
              subtitle="Open the answer review to see selected responses and the correct answers for every question in this quiz."
              icon={CheckCircle2}
            />

            <AnimatePresence mode="wait">
              {showAnswers ? (
                <motion.div
                  key="answers-open"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, y: 12 }}
                  className="grid gap-3"
                >
                  {answerList.map((answer, index) => {
                    const questionLabel = answer.questionText || answer.questionId?.text || `Question ${index + 1}`
                    const selectedIndex = answer.selectedIndex
                    const isSkipped = selectedIndex === null || selectedIndex === undefined
                    const isCorrect = !isSkipped && Number(selectedIndex) === Number(answer.correctIndex)
                    const selectedAnswer = answer.selectedAnswer || (isSkipped ? 'Skipped' : `Option ${Number(selectedIndex) + 1}`)
                    const correctAnswer = answer.correctAnswer || `Option ${Number(answer.correctIndex) + 1}`

                    return (
                      <motion.article
                        key={answer.questionId?._id || answer.questionId || index}
                        variants={itemVariants}
                        className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4 backdrop-blur-xl"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="max-w-4xl">
                            <div className="text-xs uppercase tracking-[0.24em] text-white/40">Question {index + 1}</div>
                            <div className="mt-2 text-lg font-semibold text-white">{questionLabel}</div>
                            <div className="mt-3 flex flex-wrap gap-2 text-sm text-white/75">
                              <span className={`rounded-full px-3 py-1 font-semibold ${isSkipped ? 'bg-slate-500/20 text-slate-200' : isCorrect ? 'bg-emerald-500/20 text-emerald-200' : 'bg-rose-500/20 text-rose-200'}`}>
                                {isSkipped ? 'Skipped' : isCorrect ? 'Correct' : 'Wrong'}
                              </span>
                              {answer.topic ? <BadgePill>{answer.topic}</BadgePill> : null}
                            </div>
                          </div>
                          <div className="grid min-w-[16rem] gap-2 text-sm">
                            <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white/75">
                              <span className="text-white/45">Your answer:</span> {selectedAnswer}
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white/75">
                              <span className="text-white/45">Correct answer:</span> {correctAnswer}
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    )
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="answers-closed"
                  variants={itemVariants}
                  className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-white/55 backdrop-blur-xl"
                >
                  Tap <span className="font-semibold text-white">View Answers</span> to inspect the full answer breakdown for all 36 questions.
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <div className="flex items-center justify-between border-t border-white/10 pt-4 text-sm text-white/45">
            <div>Generated for {assessmentModule.toUpperCase()} assessment</div>
            {onBack ? (
              <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-cyan-300 transition hover:text-cyan-200">
                Back to dashboard <ChevronRight className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export { TopicAnalyticsCard, ChartShell, InsightsCard, MetricChip, CircularProgressRing }
