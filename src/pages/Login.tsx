import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import { Coin, Flower, Piggy, Sparkle, Star, WashiTape } from '../doodles/Doodles'

type Mode = 'signIn' | 'signUp'

/** Stitch holes down the spine, spaced evenly however tall the screen is. */
const BINDING = [0, 1, 2, 3, 4, 5, 6, 7]

const inputClass =
  'font-note w-full rounded-[8px_11px_7px_10px] border-[1.5px] border-rule bg-card px-3 py-2.5 ' +
  'text-[16px] text-ink outline-none transition-colors focus:border-accent'

/**
 * The notebook cover — full bleed, so the whole viewport is the notebook rather
 * than a card floating on a background. On a successful sign-in the cover swings
 * open on its spine (rotateY) and the page underneath is revealed, then the app
 * mounts.
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
    // The first page of the notebook, revealed as the cover swings off it.
    <div className="paper-dots min-h-dvh">
      {/* perspective lives on the wrapper so the cover rotates in 3D */}
      <div className="min-h-dvh [perspective:1800px]">
        <div
          className={`min-h-dvh origin-left transition-transform duration-[900ms] [transform-style:preserve-3d] ${
            opening ? '[transform:rotateY(-105deg)]' : ''
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          {/* ---- the cover itself, filling the whole viewport ---- */}
          <div
            className="relative grid min-h-dvh place-items-center overflow-hidden px-5 py-10 pl-14 sm:pl-20"
            style={{
              background: 'linear-gradient(140deg, var(--cover) 0%, var(--cover-2) 100%)',
            }}
          >
            {/* spine: a darker band down the full height, with binding holes */}
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-9 sm:w-14"
              style={{ background: 'rgb(0 0 0 / 0.24)' }}
            />
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-9 w-px sm:left-14"
              style={{ background: 'rgb(255 255 255 / 0.18)' }}
            />
            <span
              aria-hidden="true"
              className="absolute inset-y-8 left-[18px] flex w-0 flex-col justify-between sm:left-7"
            >
              {BINDING.map((i) => (
                <span
                  key={i}
                  className="-ml-[5px] h-[10px] w-[10px] rounded-full"
                  style={{
                    background: 'rgb(0 0 0 / 0.35)',
                    boxShadow: 'inset 0 1px 1px rgb(255 255 255 / 0.25)',
                  }}
                />
              ))}
            </span>

            {/* stitched edge, like a bound cover */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-4 rounded-[10px] border border-dashed border-white/20 sm:inset-6"
            />

            {/* elastic closure down the right edge */}
            <span
              aria-hidden="true"
              className="absolute inset-y-0 right-6 w-[8px] sm:right-10"
              style={{ background: 'rgb(0 0 0 / 0.28)' }}
            />

            {/* cover doodles, embossed rather than drawn */}
            <Flower
              aria-hidden="true"
              className="pointer-events-none absolute -right-6 top-6 h-40 w-40 rotate-12 text-white/10"
            />
            <Piggy
              aria-hidden="true"
              className="pointer-events-none absolute -left-2 bottom-10 h-32 w-32 -rotate-6 text-white/10 sm:left-20"
            />
            <Coin
              aria-hidden="true"
              className="pointer-events-none absolute right-24 bottom-16 h-20 w-20 -rotate-12 text-white/10"
            />
            <Sparkle
              aria-hidden="true"
              className="pointer-events-none absolute left-1/3 top-10 hidden h-12 w-12 text-white/10 sm:block"
            />

            {/* ---- the label: a page taped to the cover ---- */}
            <form
              onSubmit={handleSubmit}
              className="paper-lines relative z-10 w-full max-w-[400px] -rotate-[0.6deg] rounded-[10px_16px_9px_14px] px-6 pb-7 pt-9 shadow-[0_22px_45px_-14px_rgba(0,0,0,0.55)]"
            >
              <WashiTape
                aria-hidden="true"
                className="absolute -left-6 -top-4 h-8 w-32 -rotate-12 text-tape"
              />
              <WashiTape
                aria-hidden="true"
                className="absolute -right-6 -bottom-4 h-8 w-32 -rotate-12 text-tape"
              />

              <div className="relative mb-6 text-center">
                <Star aria-hidden="true" className="absolute -left-1 -top-4 h-7 w-7 text-accent" />
                <h1 className="font-hand text-[2.4rem] leading-none text-ink">{t('app.name')}</h1>
                <p className="font-sketch mt-1 text-[0.8rem] tracking-wide text-ink-soft">
                  {t('app.tagline')}
                </p>
              </div>

              <div className="relative space-y-3">
                <label className="block">
                  <span className="cell-label mb-1 block">{t('auth.email')}</span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="cell-label mb-1 block">{t('auth.password')}</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                  {mode === 'signUp' && (
                    <span className="mt-1 block text-[0.78rem] text-ink-faint">
                      {t('auth.passwordHint')}
                    </span>
                  )}
                </label>

                {error && (
                  <p role="alert" className="text-[0.9rem] text-money-out">
                    {error}
                  </p>
                )}
                {notice && (
                  <p role="status" className="text-[0.9rem] text-ink">
                    {notice}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy || opening}
                  className="font-hand mt-1 w-full rounded-[11px_14px_9px_13px] px-4 py-2.5 text-[1.5rem] leading-none text-paper shadow-md transition-transform active:scale-[0.98] disabled:opacity-70"
                  style={{
                    background: 'linear-gradient(140deg, var(--cover) 0%, var(--cover-2) 100%)',
                  }}
                >
                  {mode === 'signUp'
                    ? busy
                      ? t('auth.signingUp')
                      : t('auth.signUp')
                    : busy
                      ? t('auth.signingIn')
                      : t('auth.signIn')}
                </button>

                <div className="flex items-center justify-between pt-1 text-[0.85rem] text-ink-soft">
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'signIn' ? 'signUp' : 'signIn')
                      setError(null)
                      setNotice(null)
                    }}
                    className="underline decoration-ink-faint underline-offset-4"
                  >
                    {mode === 'signIn' ? t('auth.toSignUp') : t('auth.toSignIn')}
                  </button>
                  {mode === 'signIn' && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="underline decoration-ink-faint underline-offset-4"
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
    </div>
  )
}
