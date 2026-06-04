import React from 'react'
import { Routes, Route, Link, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Quiz from './pages/Quiz'
import Result from './pages/Result'
import AnalyticsDashboard from './pages/AnalyticsDashboard'
import CodingAssessment from './pages/CodingAssessment'
import AIQuestionGenerator from './pages/AIQuestionGenerator'
import MockInterview from './pages/MockInterview'
import ProtectedRoute from './components/ProtectedRoute'
import GrowthDashboard from './pages/GrowthDashboard'
import AdminDashboard from './pages/AdminDashboard'
import LanguageSwitcher from './components/LanguageSwitcher'
import { useLanguage } from './context/LanguageContext'

export default function App() {
  const { t } = useLanguage()
  const token = localStorage.getItem('token')
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch (error) {
      return null
    }
  })()

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-900">
      <nav className="sticky top-0 z-30 border-b border-white/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/dashboard" className="text-lg font-black tracking-tight text-slate-950">
            {t('appName')}
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-600">
            <Link to="/dashboard" className="rounded-full px-3 py-2 transition hover:bg-slate-100">{t('nav.dashboard')}</Link>
            <Link to="/growth" className="rounded-full px-3 py-2 transition hover:bg-slate-100">{t('nav.growth')}</Link>
            <Link to="/analytics" className="rounded-full px-3 py-2 transition hover:bg-slate-100">{t('nav.analytics')}</Link>
            <Link to="/ai" className="rounded-full px-3 py-2 transition hover:bg-slate-100">{t('nav.ai')}</Link>
            <Link to="/coding" className="rounded-full px-3 py-2 transition hover:bg-slate-100">{t('nav.coding')}</Link>
            <Link to="/interview" className="rounded-full px-3 py-2 transition hover:bg-slate-100">{t('nav.interview')}</Link>
            <Link to={{ pathname: '/dashboard', hash: '#resume' }} className="rounded-full px-3 py-2 transition hover:bg-slate-100">Resume</Link>
            {user?.role === 'admin' ? <Link to="/admin" className="rounded-full px-3 py-2 transition hover:bg-slate-100">{t('nav.admin')}</Link> : null}
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/dashboard" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm">{user?.name || 'Account'}</Link>
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
          <Route path="/growth" element={<ProtectedRoute><GrowthDashboard /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsDashboard/></ProtectedRoute>} />
          <Route path="/coding" element={<ProtectedRoute><CodingAssessment/></ProtectedRoute>} />
          <Route path="/ai" element={<ProtectedRoute><AIQuestionGenerator/></ProtectedRoute>} />
          <Route path="/interview" element={<ProtectedRoute><MockInterview/></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute><Quiz/></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/result/:id" element={<ProtectedRoute><Result/></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  )
}
