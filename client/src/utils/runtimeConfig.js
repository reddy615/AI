export function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.__APP_CONFIG__?.apiUrl) {
    return window.__APP_CONFIG__.apiUrl
  }

  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  // Default to same origin if not provided — avoids hardcoded localhost in production.
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin
  }

  return 'http://localhost:5000'
}