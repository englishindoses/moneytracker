import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import * as repo from '../data/repository'
import type { LanguageCode, ThemeName } from '../data/types'
import { applyLanguage, cachedLanguage } from '../i18n'
import { useAuth } from './auth'

const THEME_CACHE_KEY = 'mt.theme'

/** The whole set, in the order the picker shows them. Also the guard for
 *  anything coming back from localStorage or the profile row. */
export const THEMES: ThemeName[] = ['neutral', 'warm', 'cool', 'typewriter', 'plain']

function isTheme(value: unknown): value is ThemeName {
  return THEMES.includes(value as ThemeName)
}

export function cachedTheme(): ThemeName {
  try {
    const stored = window.localStorage.getItem(THEME_CACHE_KEY)
    if (isTheme(stored)) return stored
  } catch {
    /* ignore */
  }
  return 'neutral'
}

export function applyTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme
  try {
    window.localStorage.setItem(THEME_CACHE_KEY, theme)
  } catch {
    /* ignore */
  }
}

interface SettingsState {
  theme: ThemeName
  language: LanguageCode
  setTheme: (theme: ThemeName) => void
  setLanguage: (language: LanguageCode) => void
}

const SettingsContext = createContext<SettingsState | null>(null)

/**
 * Theme and language live on the profile so they follow the account across
 * devices, but are mirrored to localStorage so a reload paints correctly before
 * the network answers.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth()
  const [theme, setThemeState] = useState<ThemeName>(cachedTheme)
  const [language, setLanguageState] = useState<LanguageCode>(cachedLanguage)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    applyLanguage(language)
  }, [language])

  // Pull the account's real preferences once we know who is signed in.
  useEffect(() => {
    if (!userId) return
    let active = true
    repo
      .fetchProfile(userId)
      .then((profile) => {
        if (!active || !profile) return
        if (isTheme(profile.theme)) setThemeState(profile.theme)
        setLanguageState(profile.language)
      })
      .catch(() => {
        /* keep the cached values; the user can still change them */
      })
    return () => {
      active = false
    }
  }, [userId])

  const setTheme = useCallback(
    (next: ThemeName) => {
      setThemeState(next)
      if (userId) void repo.updateProfile(userId, { theme: next }).catch(() => {})
    },
    [userId],
  )

  const setLanguage = useCallback(
    (next: LanguageCode) => {
      setLanguageState(next)
      if (userId) void repo.updateProfile(userId, { language: next }).catch(() => {})
    },
    [userId],
  )

  return (
    <SettingsContext.Provider value={{ theme, language, setTheme, setLanguage }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsState {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}
