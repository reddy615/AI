import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { Provider } from 'react-redux'
import store from './store/store'
import { LanguageProvider } from './context/LanguageContext'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <LanguageProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </LanguageProvider>
    </Provider>
  </React.StrictMode>
)
