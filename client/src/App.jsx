import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useDispatch } from 'react-redux'
import { setUser } from './store/store'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Resume from './pages/Resume'
import ResumeAnalytics from './pages/ResumeAnalytics'
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
import PageTransition from './components/PageTransition'
import Footer from './components/Footer'
import { useLanguage } from './context/LanguageContext'
import api from './api/api'

export default function App() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUserState] = useState(null)
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('token')

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await api.get('/api/profile')
          setUserState(response.data)
          dispatch(setUser(response.data))
        } catch (error) {
          console.error('Error loading user:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
      setLoading(false)
    }
    loadUser()
  }, [token, dispatch])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUserState(null)
    dispatch(setUser(null))
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 p-3 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white animate-spin">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3"/>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="30 100" strokeDashoffset="0"/>
            </svg>
          </div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navigation user={user} onLogout={handleLogout} />
      <main className="flex-1 pt-20">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={!token ? <PageTransition><Home /></PageTransition> : <Navigate to="/dashboard" replace />} />
            <Route path="/login" element={!token ? <PageTransition><Login /></PageTransition> : <Navigate to="/dashboard" replace />} />
            <Route path="/register" element={!token ? <PageTransition><Register /></PageTransition> : <Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><PageTransition><Dashboard /></PageTransition></ProtectedRoute>} />
            <Route path="/resume" element={<ProtectedRoute><PageTransition><Resume /></PageTransition></ProtectedRoute>} />
            <Route path="/resume/analytics" element={<ProtectedRoute><PageTransition><ResumeAnalytics /></PageTransition></ProtectedRoute>} />
            <Route path="/growth" element={<ProtectedRoute><PageTransition><GrowthDashboard /></PageTransition></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><PageTransition><AnalyticsDashboard /></PageTransition></ProtectedRoute>} />
            <Route path="/quiz" element={<ProtectedRoute><PageTransition><Quiz /></PageTransition></ProtectedRoute>} />
            <Route path="/result/:id" element={<ProtectedRoute><PageTransition><Result /></PageTransition></ProtectedRoute>} />
            <Route path="/coding" element={<ProtectedRoute><PageTransition><CodingAssessment /></PageTransition></ProtectedRoute>} />
            <Route path="/ai" element={<ProtectedRoute><PageTransition><AIQuestionGenerator /></PageTransition></ProtectedRoute>} />
            <Route path="/interview" element={<ProtectedRoute><PageTransition><MockInterview /></PageTransition></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><PageTransition><AdminDashboard /></PageTransition></ProtectedRoute>} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}
