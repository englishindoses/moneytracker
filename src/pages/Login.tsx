import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import { useSettings } from '../lib/settings'
import { Coin, Flower, Piggy, Sparkle, Star, WashiTape } from '../doodles/Doodles'

type Mode = 'signIn' | 'signUp'

const COVER_GRADIENT =
  'linear-gradient(150deg, color-mix(in srgb, var(--cover) 82%, white) 0%, ' +
  'var(--cover) 42%, var(--cover-2) 100%)'

const inputClass =
  'font-note w-full rounded-[8px_11px_7px_10px] border-[1.5px] border-rule bg-card px-3 py-2.5 ' +
  'text-[16px] text-ink outline-none transition-colors focus:border-accent'

/**
 * The notebook cover — full bleed, so the whole viewport is the notebook rather
 * than a card floating on a background. On a successful sign-in the cover swings
 * open on its spine (rotateY) and the page underneath is revealed, then the app
 * mounts.
 *
 * The Clean theme has no notebook: it gets the same swing, but off a flat panel.
 */
export function Login() {
  const { t } = useTranslation()
  const { signIn, signUp, resetPassword } = useAuth()
  const { theme } = useSettings()

  const bound = theme !== 'plain'

  const [mode, setMode] = useState<Mode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [opening, setOpening] = useState(false)

  /**
   * "Full page" on a phone means more than a full-height <div>: the strip the
   * browser paints when you overscroll, and the status bar in the installed app,
   * both come from <html> and the theme-color meta. Both are cream by default,
   * which left the cover looking like a panel with a border. Repaint them in the
   * cover colour for as long as this screen is up, and put them back after.
   */
  useEffect(() => {
    const html = document.documentElement
    const previousBackground = html.style.background
    const cover = getComputedStyle(html).getPropertyValue('--cover-2').trim()

    html.style.background = cover

    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    const previousThemeColor = meta?.content
    if (meta && cover) meta.content = cover

    return () => {
      html.style.background = previousBackground
      if (meta && previousThemeColor !== undefined) meta.content = previousThemeColor
    }
  }, [theme])

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
            className={`relative grid min-h-dvh place-items-center overflow-hidden px-5 py-10 ${
              bound ? 'pl-16 sm:pl-24' : ''
            }`}
            style={{ background: COVER_GRADIENT }}
          >
            {bound && <CoverChrome />}

            {/* ---- the label: a page taped to the cover ---- */}
            <form
              onSubmit={handleSubmit}
              className={`relative z-10 w-full max-w-[400px] px-6 pb-7 pt-9 ${
                bound
                  ? 'paper-lines -rotate-[0.6deg] rounded-[10px_16px_9px_14px] shadow-[0_26px_50px_-16px_rgba(0,0,0,0.6)]'
                  : 'bg-card rounded-[16px] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)]'
              }`}
            >
              {bound && (
                <>
                  <WashiTape
                    aria-hidden="true"
                    className="absolute -left-6 -top-4 h-8 w-32 -rotate-12 text-tape"
                  />
                  <WashiTape
                    aria-hidden="true"
                    className="absolute -right-6 -bottom-4 h-8 w-32 -rotate-12 text-tape"
                  />
                </>
              )}

              <div className="relative mb-6 text-center">
                {bound && (
                  <Star aria-hidden="true" className="absolute -left-1 -top-4 h-7 w-7 text-accent" />
                )}
                {/* The display faces vary a lot in width, so the title is sized
                    for the narrowest phone and only grows once there is room. */}
                <h1 className="font-hand break-words text-[2.1rem] leading-tight text-ink sm:text-[2.5rem]">
                  {t('app.name')}
                </h1>
                <p className="font-sketch mt-1 break-words text-[0.85rem] tracking-wide text-ink-soft">
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
                    <span className="mt-1 block text-[0.82rem] text-ink-soft">
                      {t('auth.passwordHint')}
                    </span>
                  )}
                </label>

                {error && (
                  <p role="alert" className="text-[0.92rem] text-money-out">
                    {error}
                  </p>
                )}
                {notice && (
                  <p role="status" className="text-[0.92rem] text-ink">
                    {notice}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy || opening}
                  className={`font-hand mt-1 w-full break-words px-4 py-2.5 text-[1.45rem] leading-tight text-white shadow-md transition-transform active:scale-[0.98] disabled:opacity-70 sm:text-[1.6rem] ${
                    bound ? 'rounded-[11px_14px_9px_13px]' : 'rounded-[12px]'
                  }`}
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

                <div className="flex items-center justify-between pt-1 text-[0.88rem] text-ink-soft">
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'signIn' ? 'signUp' : 'signIn')
                      setError(null)
                      setNotice(null)
                    }}
                    className="underline decoration-ink-faint underline-offset-4 hover:text-ink"
                  >
                    {mode === 'signIn' ? t('auth.toSignUp') : t('auth.toSignIn')}
                  </button>
                  {mode === 'signIn' && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="underline decoration-ink-faint underline-offset-4 hover:text-ink"
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

/* -------------------------------------------------------------------------- */

/**
 * Everything that makes the cover read as a bound hardback rather than a
 * coloured rectangle: woven cloth, a lit top-left corner, a contrasting spine
 * with stitching, a foil-stamped double frame and the elastic closure.
 *
 * All of it is decoration drawn from `--cover-trim`, so a theme swap restyles
 * the binding along with everything else.
 */
function CoverChrome() {
  return (
    <>
      {/* bookcloth weave */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgb(255 255 255 / 0.055) 0 1px, transparent 1px 5px),' +
            'repeating-linear-gradient(-45deg, rgb(0 0 0 / 0.055) 0 1px, transparent 1px 5px)',
        }}
      />

      {/* light falling across it from the top-left, dark into the far corners */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 22% 6%, rgb(255 255 255 / 0.24) 0%, transparent 55%),' +
            'radial-gradient(135% 105% at 55% 100%, transparent 45%, rgb(0 0 0 / 0.40) 100%)',
        }}
      />

      {/* ---- the spine ---- */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-11 sm:w-[4.5rem]"
        style={{
          background:
            'linear-gradient(to right, rgb(0 0 0 / 0.34) 0%, rgb(0 0 0 / 0.10) 55%, rgb(255 255 255 / 0.07) 100%)',
        }}
      />
      {/* foil rules either side of the stitching */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-[6px] w-px bg-cover-trim/35 sm:left-2"
      />
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-11 w-px bg-cover-trim/45 sm:left-[4.5rem]"
      />
      {/* hand stitching down the fold */}
      <span
        aria-hidden="true"
        className="absolute inset-y-8 left-[22px] border-l-2 border-dashed border-cover-trim/55 sm:left-9"
      />

      {/* ---- foil-stamped double frame, starting clear of the spine ---- */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-4 left-[3.75rem] right-4 rounded-[6px] border border-cover-trim/45 sm:inset-y-7 sm:left-[5.75rem] sm:right-7"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-[22px] left-[4.15rem] right-[26px] rounded-[4px] border border-cover-trim/20 sm:inset-y-9 sm:left-[6.25rem] sm:right-9"
      />

      {/* ---- the elastic closure ---- */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 right-6 w-[9px] sm:right-11 sm:w-[11px]"
        style={{
          background:
            'linear-gradient(to right, rgb(255 255 255 / 0.08) 0%, rgb(0 0 0 / 0.45) 30%, ' +
            'rgb(0 0 0 / 0.45) 70%, rgb(255 255 255 / 0.10) 100%)',
          boxShadow: '0 0 12px rgb(0 0 0 / 0.35)',
        }}
      />

      {/* ---- blind-embossed doodles ---- */}
      <Flower
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 top-8 h-40 w-40 rotate-12 text-cover-trim/20"
      />
      <Piggy
        aria-hidden="true"
        className="pointer-events-none absolute left-16 bottom-10 h-32 w-32 -rotate-6 text-cover-trim/20 sm:left-28"
      />
      <Coin
        aria-hidden="true"
        className="pointer-events-none absolute right-24 bottom-20 h-20 w-20 -rotate-12 text-cover-trim/20"
      />
      <Sparkle
        aria-hidden="true"
        className="pointer-events-none absolute left-1/3 top-12 hidden h-12 w-12 text-cover-trim/25 sm:block"
      />
    </>
  )
}
