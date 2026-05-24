import React, { createContext, useContext, useMemo, useState } from 'react'
import api from '../api/api'
import { languageOptions, translations } from '../i18n/translations'

const LanguageContext = createContext(null)

function getInitialLanguage() {
  return localStorage.getItem('preferredLanguage') || 'en'
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage())

  const setLanguage = async (nextLanguage) => {
    setLanguageState(nextLanguage)
    localStorage.setItem('preferredLanguage', nextLanguage)

    try {
      await api.put('/api/profile/preferences', { preferredLanguage: nextLanguage })
    } catch (error) {
      console.error(error)
    }
  }

  const value = useMemo(() => ({
    language,
    languages: languageOptions,
    setLanguage,
    t: (path) => {
      const keys = String(path || '').split('.')
      let current = translations[language] || translations.en
      for (const key of keys) {
        current = current?.[key]
      }
      if (typeof current === 'string') return current
      return path
    },
  }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider')
  }
  return context
}