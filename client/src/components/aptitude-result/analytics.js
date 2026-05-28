import { Activity, ArrowUpRight, Award, BarChart3, BadgeCheck, BrainCircuit, Calculator, Clock3, Flame, Lightbulb, Percent, PieChart, Radar, Scale, Sparkles, Sigma, Target, TrendingUp, Trophy } from 'lucide-react'

export const topicIconMap = {
  Percentages: Percent,
  'Ratios and Proportions': Scale,
  Averages: Sigma,
  'Profit and Loss': TrendingUp,
  'Simple Interest': Clock3,
  'Compound Interest': Clock3,
  'Time, Speed and Distance': ArrowUpRight,
  'Time and Work': Target,
  'Pipes and Cisterns': Activity,
  'Mixtures and Allegations': Sparkles,
  'Sequences and Series': BarChart3,
  'Permutations and Combinations': Calculator,
  Probability: Sparkles,
  Geometry: Target,
  Mensuration: Activity,
  'Data Interpretation': PieChart,
  'Number System': Calculator,
  Algebra: BrainCircuit,
}

export function formatDuration(seconds) {
  const totalSeconds = Math.max(Number(seconds) || 0, 0)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60
  if (minutes === 0) return `${remainingSeconds}s`
  return `${minutes}m ${String(remainingSeconds).padStart(2, '0')}s`
}

export function estimateRank(accuracy, score) {
  if (accuracy >= 95) return { label: 'Elite 1%', tone: 'from-emerald-400 to-cyan-300' }
  if (accuracy >= 90) return { label: 'Top 5%', tone: 'from-sky-400 to-blue-300' }
  if (accuracy >= 80) return { label: 'Top 12%', tone: 'from-violet-400 to-fuchsia-300' }
  if (accuracy >= 70) return { label: 'Top 25%', tone: 'from-amber-400 to-orange-300' }
  if (accuracy >= 60) return { label: 'Competitive', tone: 'from-rose-400 to-pink-300' }
  return { label: 'Foundation Stage', tone: 'from-slate-400 to-slate-300' }
}

function safeNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0
}

function calculateTopicAccuracy(topicStats) {
  const total = Math.max(safeNumber(topicStats.correct) + safeNumber(topicStats.wrong) + safeNumber(topicStats.skipped), safeNumber(topicStats.total), 1)
  return Math.round((safeNumber(topicStats.correct) / total) * 100)
}

function buildTopicHistorySeries(topic, history = [], fallbackAccuracy = 0) {
  const aptitudeAttempts = (Array.isArray(history) ? history : [])
    .filter((attempt) => attempt?.module === 'aptitude')
    .slice(-6)

  const series = aptitudeAttempts.map((attempt) => {
    const answers = Array.isArray(attempt.answers) ? attempt.answers : []
    const topicAnswers = answers.filter((answer) => (answer.topic || answer.questionId?.topic) === topic)
    const total = topicAnswers.length
    if (!total) return null
    const correct = topicAnswers.filter((answer) => Number(answer.selectedIndex) === Number(answer.correctIndex)).length
    return Math.round((correct / total) * 100)
  }).filter((value) => value !== null)

  if (series.length >= 2) return series

  return [
    Math.max(0, fallbackAccuracy - 18),
    Math.max(0, fallbackAccuracy - 10),
    Math.max(0, fallbackAccuracy - 4),
    fallbackAccuracy,
  ]
}

function buildOverallTrend(history = [], currentAttempt = {}) {
  const aptitudeAttempts = (Array.isArray(history) ? history : [])
    .filter((attempt) => attempt?.module === 'aptitude')
    .slice(-8)

  const data = aptitudeAttempts.map((attempt, index) => {
    const answers = Array.isArray(attempt.answers) ? attempt.answers : []
    const total = Math.max(
      safeNumber(attempt.totalQuestions),
      safeNumber(attempt.correctCount) + safeNumber(attempt.wrongCount) + safeNumber(attempt.skippedCount),
      answers.length,
      1,
    )
    const accuracy = Math.round((safeNumber(attempt.correctCount) / total) * 100)
    return {
      attempt: index + 1,
      score: safeNumber(attempt.score),
      accuracy,
    }
  })

  if (!data.length && currentAttempt) {
    const total = Math.max(
      safeNumber(currentAttempt.totalQuestions),
      safeNumber(currentAttempt.correctCount) + safeNumber(currentAttempt.wrongCount) + safeNumber(currentAttempt.skippedCount),
      Array.isArray(currentAttempt.answers) ? currentAttempt.answers.length : 1,
      1,
    )
    const accuracy = Math.round((safeNumber(currentAttempt.correctCount) / total) * 100)
    return [{ attempt: 1, score: safeNumber(currentAttempt.score), accuracy }]
  }

  return data
}

export function buildAptitudeAnalytics({ attempt = {}, analytics = {}, history = [], gamification = null }) {
  const answers = Array.isArray(attempt.answers) ? attempt.answers : []
  const correct = safeNumber(attempt.correctCount)
  const wrong = safeNumber(attempt.wrongCount)
  const skipped = safeNumber(attempt.skippedCount)
  const totalQuestions = Math.max(
    safeNumber(attempt.totalQuestions),
    correct + wrong + skipped,
    answers.length,
    1,
  )
  const accuracy = Math.round((correct / totalQuestions) * 100)
  const score = safeNumber(attempt.score)
  const duration = formatDuration(attempt.durationSeconds)
  const rankEstimate = estimateRank(accuracy, score)

  const topicCards = Object.entries(analytics?.byTopic || {}).map(([topic, stats], index) => {
    const topicAccuracy = calculateTopicAccuracy(stats)
    return {
      topic,
      index,
      icon: topicIconMap[topic] || Activity,
      accuracy: topicAccuracy,
      correct: safeNumber(stats.correct),
      wrong: safeNumber(stats.wrong),
      skipped: safeNumber(stats.skipped),
      score: safeNumber(stats.score),
      total: Math.max(safeNumber(stats.total), 1),
      sparkline: buildTopicHistorySeries(topic, history, topicAccuracy),
    }
  })

  const sortedWeakTopics = [...topicCards].sort((left, right) => left.accuracy - right.accuracy)
  const sortedStrongTopics = [...topicCards].sort((left, right) => right.accuracy - left.accuracy)

  const radarData = sortedStrongTopics.slice(0, 8).map((item) => ({
    subject: item.topic.length > 12 ? `${item.topic.slice(0, 11)}…` : item.topic,
    strength: Math.max(item.accuracy, 8),
    fullName: item.topic,
  }))

  const barData = topicCards.map((item) => ({
    topic: item.topic.length > 14 ? `${item.topic.slice(0, 12)}…` : item.topic,
    correct: item.correct,
    wrong: item.wrong,
    skipped: item.skipped,
  }))

  const donutData = [
    { name: 'Correct', value: correct, color: '#22c55e' },
    { name: 'Wrong', value: wrong, color: '#ef4444' },
    { name: 'Skipped', value: skipped, color: '#94a3b8' },
  ]

  const trendData = buildOverallTrend(history, attempt)

  const weakTopics = sortedWeakTopics.slice(0, 4)
  const strengthIndicators = sortedStrongTopics.slice(0, 3)
  const suggestedTopics = weakTopics.map((topic) => topic.topic)
  const recommendations = weakTopics.length ? weakTopics.map((topic) => ({
    title: `Rebuild ${topic.topic}`,
    description: `Run short, timed practice on ${topic.topic} and review the missed patterns before taking the next attempt.`,
  })) : [
    {
      title: 'Keep the momentum',
      description: 'Your current attempt is balanced. Push a harder timed set to tighten speed and consistency.',
    },
  ]

  const xpEarned = Math.max(0, Math.round(score * 12 + accuracy * 2 + correct * 8 - wrong * 4))
  const currentXp = safeNumber(gamification?.progress?.xp)
  const nextLevelXp = safeNumber(gamification?.nextLevelXp || gamification?.xpToNextLevel || 250) || 250
  const rankProgress = Math.min(100, Math.round((currentXp / Math.max(nextLevelXp, 1)) * 100))
  const badges = Array.isArray(gamification?.progress?.badges) ? gamification.progress.badges : []
  const level = safeNumber(gamification?.progress?.level) || 1
  const streak = safeNumber(gamification?.progress?.streak)
  const longestStreak = safeNumber(gamification?.progress?.longestStreak)

  return {
    answers,
    correct,
    wrong,
    skipped,
    score,
    totalQuestions,
    accuracy,
    duration,
    rankEstimate,
    topicCards,
    radarData,
    barData,
    donutData,
    trendData,
    weakTopics,
    strengthIndicators,
    suggestedTopics,
    recommendations,
    xpEarned,
    currentXp,
    nextLevelXp,
    rankProgress,
    badges,
    level,
    streak,
    longestStreak,
  }
}

export const analyticsMotif = {
  heroGlow: 'bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.32),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.22),_transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.94))]',
  card: 'rounded-[1.75rem] border border-white/10 bg-white/6 shadow-[0_30px_100px_-35px_rgba(15,23,42,0.9)] backdrop-blur-xl',
  panel: 'rounded-[1.5rem] border border-white/10 bg-white/5 backdrop-blur-xl',
  glow: 'shadow-[0_0_45px_rgba(56,189,248,0.25)]',
  warmGlow: 'shadow-[0_0_45px_rgba(217,70,239,0.18)]',
}

export const supportedTopicIcons = {
  Percent,
  Scale,
  Sigma,
  TrendingUp,
  Clock3,
  ArrowUpRight,
  Target,
  Sparkles,
  BarChart3,
  Calculator,
  PieChart,
  Radar,
  BrainCircuit,
  Trophy,
  Flame,
  Award,
  BadgeCheck,
  Lightbulb,
}
