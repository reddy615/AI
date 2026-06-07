import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function ProtectedRoute({ children, roles }) {
  const token = useSelector((s) => s.auth.token)
  const user = useSelector((s) => s.auth.user)

  if (!token) return <Navigate to="/" replace />

  if (Array.isArray(roles) && roles.length) {
    if (!user || !roles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}
