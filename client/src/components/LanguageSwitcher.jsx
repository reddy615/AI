import React from 'react'
import { useLanguage } from '../context/LanguageContext'

export default function LanguageSwitcher({ className = '' }) {
  const { language, languages, setLanguage, t } = useLanguage()

  return (
    <label className={`flex items-center gap-2 text-sm font-medium text-slate-700 ${className}`}>
      <span className="sr-only">{t('language.label')}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400"
      >
        {languages.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}