import { useState, type ChangeEvent, type FocusEvent, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { formatAmount, formatDate, parseAmount, parseDate } from '../lib/format'

/* --------------------------------------------------------------------------
   Money
   -------------------------------------------------------------------------- */

interface MoneyInputProps {
  value: number
  onCommit: (value: number) => void
  label: string
  /** Renders in green — used for the received/paid columns. */
  positive?: boolean
  className?: string
}

/**
 * Shows a nicely formatted "1.234,56" when idle, and the raw editable text
 * while focused. Committing on blur (rather than on every keystroke) keeps the
 * database quiet while someone is mid-number.
 */
export function MoneyInput({ value, onCommit, label, positive, className = '' }: MoneyInputProps) {
  const [draft, setDraft] = useState<string | null>(null)

  const display = draft ?? (value ? formatAmount(value) : '')

  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    setDraft(value ? String(value).replace('.', ',') : '')
    // Select-all so typing replaces rather than appends — the common case.
    requestAnimationFrame(() => event.target.select())
  }

  function handleBlur() {
    if (draft !== null) {
      const parsed = parseAmount(draft)
      if (parsed !== value) onCommit(parsed)
    }
    setDraft(null)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') event.currentTarget.blur()
    if (event.key === 'Escape') {
      setDraft(null)
      event.currentTarget.blur()
    }
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      aria-label={label}
      value={display}
      placeholder="0,00"
      onFocus={handleFocus}
      onChange={(e: ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`tabular w-full rounded-md bg-transparent px-2 py-1.5 text-right text-[15px] outline-none placeholder:text-ink-faint focus:bg-accent-soft ${
        positive && value > 0 ? 'text-money-in' : 'text-ink'
      } ${className}`}
    />
  )
}

/* --------------------------------------------------------------------------
   Text
   -------------------------------------------------------------------------- */

interface TextInputProps {
  value: string
  onCommit: (value: string) => void
  label: string
  placeholder?: string
  className?: string
}

export function TextInput({ value, onCommit, label, placeholder, className = '' }: TextInputProps) {
  const [draft, setDraft] = useState<string | null>(null)

  function handleBlur() {
    if (draft !== null && draft !== value) onCommit(draft.trim())
    setDraft(null)
  }

  return (
    <input
      type="text"
      aria-label={label}
      value={draft ?? value}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') {
          setDraft(null)
          e.currentTarget.blur()
        }
      }}
      className={`w-full rounded-md bg-transparent px-2 py-1.5 text-[17px] outline-none placeholder:text-ink-faint focus:bg-accent-soft ${className}`}
    />
  )
}

/* --------------------------------------------------------------------------
   Date — always dd/mm/yyyy, with the native picker still a tap away
   -------------------------------------------------------------------------- */

interface DateInputProps {
  value: string | null
  onCommit: (value: string | null) => void
  label: string
  className?: string
}

/**
 * A bare `<input type="date">` renders in the *browser's* locale, not the page's
 * — on a device set to en-US the same row reads 12/05/2026 as December 5th. So
 * the visible field is a text box that always writes and reads day-first, and
 * the native picker moves behind the calendar button beside it, where it is
 * still one tap away on a phone.
 *
 * Anything unreadable snaps back to the stored date on blur rather than wiping
 * it — the same bargain MoneyInput makes.
 */
export function DateInput({ value, onCommit, label, className = '' }: DateInputProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<string | null>(null)

  function handleBlur() {
    if (draft !== null) {
      const parsed = parseDate(draft)
      if (parsed !== undefined && parsed !== value) onCommit(parsed)
    }
    setDraft(null)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') event.currentTarget.blur()
    if (event.key === 'Escape') {
      setDraft(null)
      event.currentTarget.blur()
    }
  }

  return (
    <span className={`flex min-w-0 items-center gap-0.5 ${className}`}>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label={label}
        value={draft ?? formatDate(value)}
        placeholder={t('common.datePlaceholder')}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="tabular w-full min-w-0 rounded-md bg-transparent px-2 py-1.5 text-[15px] text-ink-soft outline-none placeholder:text-ink-faint focus:bg-accent-soft"
      />

      {/* The picker itself, laid transparently over the icon — tapping the icon
          *is* tapping a date input, which opens the OS picker everywhere without
          needing showPicker(). It is out of the tab order and hidden from screen
          readers on purpose: it is a second way to set a value the text box next
          to it already handles, and one date per row is enough to tab through. */}
      <span className="relative grid h-6 w-6 shrink-0 place-items-center rounded-md text-ink-soft">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6.5h16v14H4zM4 10.5h16M8 3.5v4M16 3.5v4" />
          </g>
        </svg>
        <input
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          value={value ?? ''}
          onChange={(e) => onCommit(e.target.value || null)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </span>
    </span>
  )
}

/* --------------------------------------------------------------------------
   The tick box
   -------------------------------------------------------------------------- */

interface TickBoxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

/** Hand-drawn square with an ink tick. The checked state is always derived from
 *  the amounts by the caller, never stored. */
export function TickBox({ checked, onChange, label }: TickBoxProps) {
  return (
    <label className="inline-flex cursor-pointer items-center justify-center p-1.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        className="peer sr-only"
      />
      <span className="grid h-7 w-7 place-items-center rounded-[7px_5px_8px_4px] border-[1.6px] border-ink-faint text-money-in transition-colors peer-checked:border-money-in peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
        <svg
          viewBox="0 0 24 24"
          className={`h-5 w-5 transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden="true"
        >
          <path
            d="M4 13c2.5 1.5 4 3.5 5.5 6C12 13 15.5 7.5 21 3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </label>
  )
}
