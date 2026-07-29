import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './en'
import { pt } from './pt'
import type { LanguageCode } from '../data/types'

export const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'pt-BR', label: 'Português (BR)' },
]

/** Cached locally so the first paint after a reload is already in the right
 *  language, before the profile has come back from the server. */
const CACHE_KEY = 'mt.language'

export function cachedLanguage(): LanguageCode {
  try {
    const stored = window.localStorage.getItem(CACHE_KEY)
    if (stored === 'en-GB' || stored === 'pt-BR') return stored
  } catch {
    /* ignore */
  }
  return navigator.language?.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en-GB'
}

export function cacheLanguage(code: LanguageCode) {
  try {
    window.localStorage.setItem(CACHE_KEY, code)
  } catch {
    /* ignore */
  }
}

void i18next.use(initReactI18next).init({
  resources: {
    'en-GB': { translation: en },
    'pt-BR': { translation: pt },
  },
  lng: cachedLanguage(),
  fallbackLng: 'en-GB',
  interpolation: { escapeValue: false },
})

export function applyLanguage(code: LanguageCode) {
  void i18next.changeLanguage(code)
  cacheLanguage(code)
  document.documentElement.lang = code
}

export default i18next
