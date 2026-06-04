import React, { createContext, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const pushToast = (message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts((current) => [...current, { id, message, type }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 3600)
  }

  const value = useMemo(
    () => ({
      info: (message) => pushToast(message, 'info'),
      success: (message) => pushToast(message, 'success'),
      error: (message) => pushToast(message, 'error'),
    }),
    []
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-card toast-${toast.type} rounded-2xl border p-4 shadow-2xl shadow-slate-950/10 backdrop-blur-xl transition-all duration-300`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-current" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Error' : 'Notice'}</p>
                <p className="mt-1 text-sm text-slate-700">{toast.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
