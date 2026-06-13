import React, { useState } from 'react'
import api from '../api/api'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setToken, setUser } from '../store/store'
import { useToast } from '../components/ToastProvider'

export default function Register(){
  const [name,setName]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [showPassword,setShowPassword]=useState(false)
  const [error,setError]=useState(null)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const toast = useToast()

  const submit = async (e)=>{
    e.preventDefault()
    try{
      const response = await api.post('/api/auth/register',{name,email,password})
      console.log('REGISTER RESPONSE:', response.data)

      const responseSuccess = response.data?.success === true
      const backendMessage = response.data?.message || 'Registration failed'

      if (!responseSuccess) {
        console.error('FRONTEND REGISTER ERROR: backend failure', response.data)
        console.log('BACKEND ERROR MESSAGE:', backendMessage)
        toast.error(backendMessage)
        setError(backendMessage)
        return
      }

      const payload = response.data?.data || response.data || {}
      const token = payload.token || payload.accessToken || response.data?.token || null
      const user = payload.user || response.data?.user || null

      if (token) dispatch(setToken(token))
      if (user) dispatch(setUser(user))
      setError(null)
      toast.success('Registration successful')
      navigate('/dashboard')
    } catch (error) {
      console.error('FRONTEND REGISTER ERROR:', error)
      const backendMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Registration failed'
      console.log('BACKEND ERROR MESSAGE:', backendMessage)
      toast.error(backendMessage)
      setError(backendMessage)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Register</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={submit} className="space-y-3">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className="input" />
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="input" />
        <div className="relative">
          <input
            value={password}
            onChange={e=>setPassword(e.target.value)}
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            className="input pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-700"
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M3 3l18 18" />
                <path d="M10.58 10.58a2 2 0 102.83 2.83" />
                <path d="M9.88 5.09A10.94 10.94 0 0112 5c5.5 0 9.5 4.5 10 7-0.2 1-0.74 2.17-1.58 3.3" />
                <path d="M6.61 6.61C4.11 8.28 2.41 10.77 2 12c0.84 2.45 4.9 7 10 7 1.06 0 2.08-0.15 3.04-0.42" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Register</button>
      </form>
      <p className="mt-3 text-sm">Already have an account? <Link to="/login">Login</Link></p>
    </div>
  )
}
