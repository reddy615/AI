import React, { useState } from 'react'
import api from '../api/api'
import { useNavigate, Link } from 'react-router-dom'

export default function Login(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState(null)
  const navigate = useNavigate()

  const submit = async (e)=>{
    e.preventDefault()
    try{
      const res = await api.post('/api/auth/login',{email,password})
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user || {}))
      navigate('/dashboard')
    }catch(err){ setError(err.response?.data?.message || 'Error') }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={submit} className="space-y-3">
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="input" />
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" className="input" />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Login</button>
      </form>
      <p className="mt-3 text-sm">No account? <Link to="/register">Register</Link></p>
    </div>
  )
}
