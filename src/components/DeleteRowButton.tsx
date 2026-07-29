import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface DeleteRowButtonProps {
  onConfirm: () => void
  /** Only used for the accessible label, so screen readers say which row. */
  name?: string
}

/**
 * Two-step delete: the first tap arms it, the second confirms. Cheap protection
 * against a fat-fingered tap on a phone, without a modal in the way.
 */
export function DeleteRowButton({ onConfirm, name }: DeleteRowButtonProps) {
  const { t } = useTranslation()
  const [armed, setArmed] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function handleClick() {
    if (armed) {
      window.clearTimeout(timer.current)
      setArmed(false)
      onConfirm()
      return
    }
    setArmed(true)
    timer.current = window.setTimeout(() => setArmed(false), 3000)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={name ? `${t('common.deleteRow')}: ${name}` : t('common.deleteRow')}
      className={`grid h-8 w-8 place-items-center rounded-md transition-colors ${
        armed ? 'bg-money-out/15 text-money-out' : 'text-ink-faint hover:text-money-out'
      }`}
    >
      {armed ? (
        <span className="font-sketch text-[0.7rem] uppercase">ok?</span>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            d="M5 6h14M9 6V4h6v2M7 6l1 14h8l1-14M10 10v7M14 10v7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}
