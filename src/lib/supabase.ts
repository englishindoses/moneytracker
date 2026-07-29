import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.',
  )
}

const STAY_SIGNED_IN_KEY = 'mt.staySignedIn'

/** Settings → Account → "stay signed in on this device". Deliberately stored in
 *  localStorage rather than the profile: it is a property of *this device*, not
 *  of the account. */
export function getStaySignedIn(): boolean {
  try {
    return window.localStorage.getItem(STAY_SIGNED_IN_KEY) !== 'false'
  } catch {
    return true
  }
}

export function setStaySignedIn(value: boolean) {
  try {
    window.localStorage.setItem(STAY_SIGNED_IN_KEY, String(value))
  } catch {
    /* private browsing — the choice just won't persist */
  }
}

/**
 * When the user opts out of staying signed in we hand Supabase sessionStorage,
 * so the session dies with the tab instead of persisting to disk.
 */
const authStorage = getStaySignedIn() ? window.localStorage : window.sessionStorage

/** Untyped on purpose: the row shapes live in data/types.ts and are applied at
 *  the repository boundary, which keeps this file free of generated schema
 *  types that would need regenerating on every migration. */
export const supabase = createClient(url, key, {
  auth: {
    storage: authStorage,
    storageKey: 'mt.auth',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

/** Applying a change to this preference means moving the existing session
 *  between storages, otherwise the switch only takes effect after a re-login. */
export function migrateSessionStorage(staySignedIn: boolean) {
  const from = staySignedIn ? window.sessionStorage : window.localStorage
  const to = staySignedIn ? window.localStorage : window.sessionStorage
  try {
    const raw = from.getItem('mt.auth')
    if (raw) {
      to.setItem('mt.auth', raw)
      from.removeItem('mt.auth')
    }
  } catch {
    /* nothing we can do; the next sign-in will land in the right place */
  }
}
