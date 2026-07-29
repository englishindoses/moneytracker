import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Banner } from '../doodles/Doodles'
import { PageDecor } from '../doodles/PageDecor'

interface AppHeaderProps {
  title: string
  /** Where the back chevron goes; omitted on the index page. */
  backTo?: string
  backLabel?: string
}

export function AppHeader({ title, backTo, backLabel }: AppHeaderProps) {
  const { t } = useTranslation()

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
            <span className="font-sketch px-1 py-1 text-[0.9rem] text-ink-faint">
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

        <div className="relative mt-1 text-center">
          <Banner
            aria-hidden="true"
            className="mx-auto h-11 w-[min(320px,88%)] text-ink-faint"
          />
          <h1 className="font-hand absolute inset-0 grid place-items-center pb-1 text-[1.9rem] capitalize leading-none">
            {title}
          </h1>
        </div>
      </header>
    </>
  )
}
