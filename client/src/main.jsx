import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { Provider } from 'react-redux'
import store from './store/store'
import { LanguageProvider } from './context/LanguageContext'
import { ToastProvider } from './components/ToastProvider'
import ErrorBoundary from './components/ErrorBoundary'

const rootEl = document.getElementById('root')
try {
  createRoot(rootEl).render(
    <React.StrictMode>
      <Provider store={store}>
        <LanguageProvider>
          <HashRouter>
            <ToastProvider>
                <ErrorBoundary>
                  <App />
                </ErrorBoundary>
              </ToastProvider>
          </HashRouter>
        </LanguageProvider>
      </Provider>
    </React.StrictMode>
  )
} catch (err) {
  // Fallback bare HTML for catastrophic initialization errors
  console.error('App failed to mount:', err)
  if (rootEl) {
    rootEl.innerHTML = `\n      <div style="background:#0f1724;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px">\n        <div style="max-width:720px;background:rgba(15,23,36,0.8);padding:24px;border-radius:12px">\n          <h1 style="font-size:20px;margin-bottom:8px">Application failed to start</h1>\n          <pre style="white-space:pre-wrap;color:#cbd5e1">${String(err)}</pre>\n        </div>\n      </div>`
  }
}
