import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Banner } from '../doodles/Doodles'
import { PageDecor } from '../doodles/PageDecor'
import { useSettings } from '../lib/settings'

interface AppHeaderProps {
  title: string
  /** Where the back chevron goes; omitted on the index page. */
  backTo?: string
  backLabel?: string
}

export function AppHeader({ title, backTo, backLabel }: AppHeaderProps) {
  const { t } = useTranslation()
  const { theme } = useSettings()

  // The ribbon is a stationery flourish, so the Clean theme goes without it.
  const ribbon = theme !== 'plain'

  return (
    <>
      <PageDecor />
      <header className="relative z-10 mx-auto max-w-3xl px-4 pb-2 pt-4">
        <div className="flex items-start justify-between gap-2">
          {backTo ? (
            <Link
              to={backTo}
              className="font-sketch -ml-1 flex items-center gap-1 px-1 py-1 text-[0.9rem] text-ink-soft transition-colors hover:text-ink"
            >
              <span aria-hidden="true">‹</span>
              {backLabel}
            </Link>
          ) : (
            <span className="font-sketch px-1 py-1 text-[0.9rem] text-ink-soft">
              {t('app.tagline')}
            </span>
          )}

          <Link
            to="/settings"
            aria-label={t('settings.open')}
            className="sketch-box -mr-1 grid h-10 w-10 place-items-center bg-card text-ink-soft shadow-sm transition-colors hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <g
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3.2" />
                <path d="M12 3.2v2.4M12 18.4v2.4M4.8 12H2.4M21.6 12h-2.4M6.9 6.9L5.2 5.2M18.8 18.8l-1.7-1.7M17.1 6.9l1.7-1.7M5.2 18.8l1.7-1.7" />
              </g>
            </svg>
          </Link>
        </div>

        {/* The ribbon is drawn *around* the title rather than behind a fixed-width
            box, so it grows with the word inside it — "Dezembro de 2026" gets a
            wider banner than "Julho" instead of overflowing a 320px one. */}
        <div className="mt-1 flex justify-center">
          <div
            className={`relative inline-block max-w-full py-2.5 ${
              ribbon ? 'px-8 sm:px-11' : 'px-2'
            }`}
          >
            {ribbon && (
              <Banner aria-hidden="true" className="absolute inset-0 h-full w-full text-ink-faint" />
            )}
            <h1 className="font-hand relative break-words text-center text-[1.8rem] capitalize leading-tight sm:text-[2.1rem]">
              {title}
            </h1>
          </div>
        </div>
      </header>
    </>
  )
}
