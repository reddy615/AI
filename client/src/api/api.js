import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  const preferredLanguage = localStorage.getItem('preferredLanguage') || 'en'
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['Accept-Language'] = preferredLanguage
  return config
})

export default api
