export function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.__APP_CONFIG__?.apiUrl) {
    return window.__APP_CONFIG__.apiUrl
  }

  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  return import.meta.env.DEV ? 'http://localhost:5000' : 'http://localhost:5000'
}