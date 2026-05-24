import React from 'react'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, roles }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/" replace />

  if (Array.isArray(roles) && roles.length) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null')
      if (!user || !roles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />
      }
    } catch (error) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}
