import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import { Coin, Flower, Star, WashiTape } from '../doodles/Doodles'

type Mode = 'signIn' | 'signUp'

/**
 * The notebook cover. On a successful sign-in the cover swings open on its
 * spine (rotateY) and the page underneath is revealed, then the app mounts.
 */
export function Login() {
  const { t } = useTranslation()
  const { signIn, signUp, resetPassword } = useAuth()

  const [mode, setMode] = useState<Mode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [opening, setOpening] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setNotice(null)

    if (password.length < 8) {
      setError(t('auth.errorPasswordShort'))
      return
    }

    setBusy(true)
    try {
      if (mode === 'signUp') {
        const { needsConfirmation } = await signUp(email, password)
        if (needsConfirmation) {
          setNotice(t('auth.confirmSent'))
          setMode('signIn')
          return
        }
      } else {
        await signIn(email, password)
      }
      // Play the opening animation before the auth state swaps the tree out.
      setOpening(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      setError(
        /invalid login credentials/i.test(message)
          ? t('auth.errorCredentials')
          : message || t('auth.errorGeneric'),
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleReset() {
    setError(null)
    setNotice(null)
    if (!email.trim()) {
      setError(t('auth.errorEmailNeeded'))
      return
    }
    try {
      await resetPassword(email)
      setNotice(t('auth.resetSent'))
    } catch {
      setError(t('auth.errorGeneric'))
    }
  }

  return (
    <div className="paper-dots grid min-h-dvh place-items-center px-4 py-8">
      {/* perspective lives on the wrapper so the cover rotates in 3D */}
      <div className="w-full max-w-[380px] [perspective:1400px]">
        <div
          className={`relative origin-left transition-transform duration-[900ms] ease-in-out [transform-style:preserve-3d] ${
            opening ? '[transform:rotateY(-105deg)]' : ''
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          <form
            onSubmit={handleSubmit}
            className="relative overflow-hidden rounded-[6px_18px_18px_6px] px-6 pb-8 pt-10 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)]"
            style={{
              background: 'linear-gradient(140deg, var(--cover) 0%, var(--cover-2) 100%)',
            }}
          >
            {/* spine */}
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-[14px]"
              style={{ background: 'rgb(0 0 0 / 0.22)' }}
            />
            <span
              aria-hidden="true"
              className="absolute inset-y-3 left-[18px] w-px"
              style={{ background: 'rgb(255 255 255 / 0.22)' }}
            />

            {/* elastic closure */}
            <span
              aria-hidden="true"
              className="absolute inset-y-0 right-3 w-[7px]"
              style={{ background: 'rgb(0 0 0 / 0.3)' }}
            />

            <WashiTape
              aria-hidden="true"
              className="absolute -left-4 top-16 h-7 w-32 -rotate-12 text-white/25"
            />
            <Flower
              aria-hidden="true"
              className="pointer-events-none absolute -right-2 top-4 h-24 w-24 rotate-12 text-white/15"
            />
            <Coin
              aria-hidden="true"
              className="pointer-events-none absolute bottom-3 left-4 h-12 w-12 -rotate-12 text-white/15"
            />

            {/* label sticker */}
            <div className="relative mx-auto mb-7 max-w-[260px] rounded-[10px_14px_9px_13px] bg-paper/95 px-5 py-4 text-center shadow-md">
              <Star aria-hidden="true" className="absolute -left-3 -top-3 h-7 w-7 text-accent" />
              <h1 className="font-hand text-[2.1rem] leading-none text-ink">{t('app.name')}</h1>
              <p className="font-sketch mt-1 text-[0.8rem] tracking-wide text-ink-soft">
                {t('app.tagline')}
              </p>
            </div>

            <div className="relative space-y-3">
              <label className="block">
                <span className="font-sketch mb-1 block text-[0.8rem] uppercase tracking-widest text-white/70">
                  {t('auth.email')}
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-[8px_11px_7px_10px] border-[1.5px] border-white/25 bg-white/95 px-3 py-2.5 text-[16px] text-ink outline-none focus:border-white"
                />
              </label>

              <label className="block">
                <span className="font-sketch mb-1 block text-[0.8rem] uppercase tracking-widest text-white/70">
                  {t('auth.password')}
                </span>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-[10px_8px_11px_7px] border-[1.5px] border-white/25 bg-white/95 px-3 py-2.5 text-[16px] text-ink outline-none focus:border-white"
                />
                {mode === 'signUp' && (
                  <span className="mt-1 block text-[0.78rem] text-white/60">
                    {t('auth.passwordHint')}
                  </span>
                )}
              </label>

              {error && (
                <p role="alert" className="rounded-md bg-white/95 px-3 py-2 text-[0.9rem] text-money-out">
                  {error}
                </p>
              )}
              {notice && (
                <p role="status" className="rounded-md bg-white/95 px-3 py-2 text-[0.9rem] text-ink">
                  {notice}
                </p>
              )}

              <button
                type="submit"
                disabled={busy || opening}
                className="font-hand mt-1 w-full rounded-[11px_14px_9px_13px] bg-paper px-4 py-2.5 text-[1.5rem] leading-none text-ink shadow-md transition-transform active:scale-[0.98] disabled:opacity-70"
              >
                {mode === 'signUp'
                  ? busy
                    ? t('auth.signingUp')
                    : t('auth.signUp')
                  : busy
                    ? t('auth.signingIn')
                    : t('auth.signIn')}
              </button>

              <div className="flex items-center justify-between pt-1 text-[0.85rem] text-white/75">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'signIn' ? 'signUp' : 'signIn')
                    setError(null)
                    setNotice(null)
                  }}
                  className="underline decoration-white/40 underline-offset-4"
                >
                  {mode === 'signIn' ? t('auth.toSignUp') : t('auth.toSignIn')}
                </button>
                {mode === 'signIn' && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="underline decoration-white/40 underline-offset-4"
                  >
                    {t('auth.forgot')}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
