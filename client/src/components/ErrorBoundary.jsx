import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    this.setState({ error, info })
    // Temporary: log to console for debugging in production
    // Remove these logs after the root cause is fixed.
    console.error('Unhandled render error:', error)
    console.error(info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
          <div className="max-w-3xl w-full bg-gradient-to-br from-slate-900/80 to-slate-800/60 p-8 rounded-2xl backdrop-blur-xl border border-white/5">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-slate-300 mb-4">A fatal error occurred while rendering the application. Please check the console or the server logs for details.</p>
            <details className="whitespace-pre-wrap text-sm text-slate-400 bg-black/20 p-3 rounded">
              <summary className="cursor-pointer text-slate-200">Error details (expand)</summary>
              {this.state.error && String(this.state.error)}
              {this.state.info && this.state.info.componentStack}
            </details>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
