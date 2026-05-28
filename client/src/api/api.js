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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !String(originalRequest.url || '').includes('/api/auth/refresh')
    ) {
      originalRequest._retry = true

      try {
        const refreshResponse = await axios.post(`${getApiBaseUrl()}/api/auth/refresh`, {}, {
          withCredentials: true,
          headers: {
            'Accept-Language': localStorage.getItem('preferredLanguage') || 'en',
          },
        })

        const refreshData = refreshResponse.data?.data || refreshResponse.data
        if (refreshData?.token) {
          localStorage.setItem('token', refreshData.token)
        }

        if (refreshData?.user) {
          localStorage.setItem('user', JSON.stringify(refreshData.user))
        }

        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${refreshData?.token || localStorage.getItem('token')}`

        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }

    return Promise.reject(error)
  }
)

export default api
