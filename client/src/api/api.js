import axios from 'axios'
import { getApiBaseUrl } from '../utils/runtimeConfig'

const api = axios.create({
  baseURL: getApiBaseUrl(),
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
