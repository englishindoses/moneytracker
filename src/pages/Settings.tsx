import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { useExpensesRange, useIncomeRange } from '../data/hooks'
import * as repo from '../data/repository'
import type { LanguageCode, ThemeName } from '../data/types'
import { LANGUAGES } from '../i18n'
import { useAuth } from '../lib/auth'
import { buildExportTables, downloadPdf, downloadXlsx, type ExportLabels } from '../lib/export'
import { currentPeriod, monthAndYear, monthsOfYear, currentYear, periodRange } from '../lib/months'
import { getStaySignedIn, migrateSessionStorage, setStaySignedIn } from '../lib/supabase'
import { useSettings } from '../lib/settings'

const THEMES: ThemeName[] = ['neutral', 'warm', 'cool', 'typewriter']

export function Settings() {
  const { t } = useTranslation()

  return (
    <div className="paper-dots relative min-h-dvh pb-16">
      <AppHeader title={t('settings.title')} backTo="/" backLabel={t('month.back')} />
      <main className="relative z-10 mx-auto max-w-2xl space-y-4 px-4">
        <LanguageSection />
        <ThemeSection />
        <RecurringSection />
        <AccountSection />
        <DataSection />
      </main>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="sketch-box bg-card px-4 py-4 shadow-sm">
      <h2 className="font-hand text-[1.7rem] leading-none">{title}</h2>
      {hint && <p className="font-sketch mt-1 text-[0.75rem] text-ink-faint">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

function LanguageSection() {
  const { t } = useTranslation()
  const { language, setLanguage } = useSettings()

  return (
    <Section title={t('settings.language')} hint={t('settings.savedToAccount')}>
      <div className="flex flex-col gap-2 sm:flex-row">
        {LANGUAGES.map((option) => (
          <button
            key={option.code}
            type="button"
            onClick={() => setLanguage(option.code as LanguageCode)}
            aria-pressed={language === option.code}
            className={`flex-1 rounded-[11px_8px_12px_9px] border-[1.5px] px-4 py-2.5 text-left transition-colors ${
              language === option.code
                ? 'border-accent bg-accent-soft'
                : 'border-ink-faint hover:border-accent'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </Section>
  )
}

/**
 * Each option is rendered *in its own theme* — `data-theme` on the card
 * re-declares every variable for that subtree, so the swatch shows the real
 * paper, the real typefaces and the real corners, not a description of them.
 */
function ThemeSection() {
  const { t } = useTranslation()
  const { theme, setTheme } = useSettings()

  return (
    <Section title={t('settings.theme')} hint={t('settings.savedToAccount')}>
      <div className="grid gap-3 sm:grid-cols-2">
        {THEMES.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setTheme(name)}
            aria-pressed={theme === name}
            aria-label={t(`themes.${name}`)}
            className={`overflow-hidden rounded-[11px_8px_12px_9px] border-[2px] text-left transition-colors ${
              theme === name ? 'border-accent' : 'border-ink-faint/60 hover:border-accent'
            }`}
          >
            <span data-theme={name} className="paper-dots block px-3 py-3 text-ink">
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-hand block text-[1.3rem] leading-tight">
                  {t(`themes.${name}`)}
                </span>
                <span className="tabular shrink-0 text-[0.9rem] text-money-in">1.234,56</span>
              </span>

              <span className="font-note mt-1 block text-[0.85rem] leading-snug text-ink-soft">
                {t(`themes.${name}Hint`)}
              </span>

              <span className="sketch-box mt-2 flex items-center gap-1 bg-card px-2 py-1.5">
                <Chip varName="--accent" />
                <Chip varName="--accent-2" />
                <Chip varName="--money-in" />
                <Chip varName="--money-out" />
                <span className="font-sketch ml-auto whitespace-nowrap text-[0.68rem] uppercase tracking-wide text-ink-faint">
                  {theme === name ? t('themes.inUse') : t('themes.use')}
                </span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </Section>
  )
}

function Chip({ varName }: { varName: string }) {
  return (
    <span
      className="h-4 w-4 rounded-full border border-black/10"
      style={{ background: `var(${varName})` }}
    />
  )
}

/** Pointer to the recurring list, which is a page of its own. */
function RecurringSection() {
  const { t } = useTranslation()

  return (
    <Section title={t('recurring.title')} hint={t('recurring.settingsHint')}>
      <Link
        to="/recurring"
        className="flex items-center justify-between gap-3 rounded-[11px_8px_12px_9px] border-[1.5px] border-ink-faint px-4 py-2.5 transition-colors hover:border-accent"
      >
        {t('recurring.open')}
        <span aria-hidden="true" className="text-xl text-ink-faint">
          ›
        </span>
      </Link>
    </Section>
  )
}

function AccountSection() {
  const { t } = useTranslation()
  const { session, signOut } = useAuth()
  const [stay, setStay] = useState(getStaySignedIn)

  function handleToggle(next: boolean) {
    setStay(next)
    setStaySignedIn(next)
    // Move the live session between localStorage and sessionStorage so the
    // choice takes effect now rather than at the next sign-in.
    migrateSessionStorage(next)
  }

  return (
    <Section title={t('settings.account')} hint={t('settings.savedToDevice')}>
      <p className="mb-3 text-[0.95rem] text-ink-soft">
        {t('account.signedInAs')} <span className="text-ink">{session?.user.email}</span>
      </p>

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={stay}
          onChange={(e) => handleToggle(e.target.checked)}
          className="mt-1 h-5 w-5 accent-[var(--accent)]"
        />
        <span>
          <span className="block">{t('account.staySignedIn')}</span>
          <span className="font-sketch block text-[0.75rem] leading-snug text-ink-faint">
            {t('account.staySignedInHint')}
          </span>
        </span>
      </label>

      <button
        type="button"
        onClick={() => void signOut()}
        className="font-hand mt-4 w-full rounded-[11px_14px_9px_13px] border-[1.5px] border-ink-faint px-4 py-2 text-[1.4rem] leading-none transition-colors hover:border-accent"
      >
        {t('account.signOut')}
      </button>
    </Section>
  )
}

function DataSection() {
  const { t } = useTranslation()
  const { language } = useSettings()
  const queryClient = useQueryClient()

  const year = currentYear()
  const [from, setFrom] = useState(monthsOfYear(year)[0])
  const [to, setTo] = useState(currentPeriod())
  const [busy, setBusy] = useState<'xlsx' | 'pdf' | null>(null)

  const periods = useMemo(() => periodRange(from, to), [from, to])
  const income = useIncomeRange(periods)
  const expenses = useExpensesRange(periods)

  // Memoised so the table below is only rebuilt when the language changes,
  // not on every keystroke elsewhere in settings.
  const labels: ExportLabels = useMemo(
    () => ({
      income: t('month.income'),
      expenses: t('month.expenses'),
      month: t('data.monthColumn'),
      source: t('income.source'),
      date: t('income.date'),
      expected: t('income.expected'),
      received: t('income.received'),
      receivedDate: t('income.receivedDate'),
      expense: t('expenses.name'),
      dueDate: t('expenses.dueDate'),
      due: t('expenses.due'),
      paid: t('expenses.paid'),
      total: t('common.total'),
    }),
    [t],
  )

  const tables = useMemo(
    () => buildExportTables(income.data ?? [], expenses.data ?? [], labels, language),
    [income.data, expenses.data, labels, language],
  )

  const rangeTitle = `${monthAndYear(from, language)} — ${monthAndYear(to, language)}`
  const fileStem = `money-tracker_${from.slice(0, 7)}_${to.slice(0, 7)}`

  async function handleXlsx() {
    setBusy('xlsx')
    try {
      await downloadXlsx(tables, labels, `${fileStem}.xlsx`)
    } finally {
      setBusy(null)
    }
  }

  async function handlePdf() {
    setBusy('pdf')
    try {
      await downloadPdf(tables, labels, `${fileStem}.pdf`, `${t('app.name')} · ${rangeTitle}`)
    } finally {
      setBusy(null)
    }
  }

  const monthOptions = useMemo(
    () => [year - 1, year, year + 1].flatMap((y) => monthsOfYear(y)),
    [year],
  )

  return (
    <Section title={t('settings.data')}>
      <h3 className="font-sketch mb-2 text-[0.8rem] uppercase tracking-widest text-ink-faint">
        {t('data.exportTitle')}
      </h3>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="cell-label mb-1 block">{t('data.from')}</span>
          <MonthSelect value={from} options={monthOptions} locale={language} onChange={setFrom} />
        </label>
        <label className="block">
          <span className="cell-label mb-1 block">{t('data.to')}</span>
          <MonthSelect value={to} options={monthOptions} locale={language} onChange={setTo} />
        </label>
      </div>

      <div className="mt-3">
        <h4 className="font-sketch mb-1 text-[0.8rem] uppercase tracking-widest text-ink-faint">
          {t('data.preview')} · {tables.rowCount} {t('data.rows')}
        </h4>

        {tables.rowCount === 0 ? (
          <p className="py-3 text-ink-faint">{t('data.nothingToExport')}</p>
        ) : (
          <div className="max-h-72 overflow-auto rounded-md border border-rule">
            <PreviewTable caption={labels.income} table={tables.income} />
            <PreviewTable caption={labels.expenses} table={tables.expenses} />
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => void handleXlsx()}
          disabled={busy !== null || tables.rowCount === 0}
          className="flex-1 rounded-[11px_8px_12px_9px] border-[1.5px] border-ink-faint px-4 py-2.5 transition-colors hover:border-accent disabled:opacity-50"
        >
          {t('data.downloadExcel')}
        </button>
        <button
          type="button"
          onClick={() => void handlePdf()}
          disabled={busy !== null || tables.rowCount === 0}
          className="flex-1 rounded-[11px_8px_12px_9px] border-[1.5px] border-ink-faint px-4 py-2.5 transition-colors hover:border-accent disabled:opacity-50"
        >
          {t('data.downloadPdf')}
        </button>
      </div>

      <DangerZone
        onDeleted={() => {
          void queryClient.invalidateQueries()
        }}
      />
    </Section>
  )
}

function MonthSelect({
  value,
  options,
  locale,
  onChange,
}: {
  value: string
  options: string[]
  locale: string
  onChange: (period: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border-[1.5px] border-ink-faint bg-card px-2 py-2 capitalize"
    >
      {options.map((period) => (
        <option key={period} value={period}>
          {monthAndYear(period, locale)}
        </option>
      ))}
    </select>
  )
}

function PreviewTable({
  caption,
  table,
}: {
  caption: string
  table: { head: string[]; body: string[][]; totals: string[] }
}) {
  return (
    <table className="w-full border-collapse text-left text-[0.85rem]">
      <caption className="font-sketch bg-accent-soft px-2 py-1 text-left text-[0.75rem] uppercase tracking-widest">
        {caption}
      </caption>
      <thead>
        <tr>
          {table.head.map((cell) => (
            <th key={cell} className="cell-label whitespace-nowrap px-2 py-1">
              {cell}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.body.map((row, i) => (
          <tr key={i} className="border-t border-rule">
            {row.map((cell, j) => (
              <td key={j} className={`whitespace-nowrap px-2 py-1 ${j >= 3 ? 'tabular' : ''}`}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
        <tr className="border-t-[1.5px] border-ink-faint font-semibold">
          {table.totals.map((cell, j) => (
            <td key={j} className={`whitespace-nowrap px-2 py-1 ${j >= 3 ? 'tabular' : ''}`}>
              {cell}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  )
}

/**
 * Delete-all-data in two steps: press the button, *then* confirm by typing the
 * word. The confirmation only appears once you have asked for it, so the
 * settings page isn't sitting there with a delete box waiting to be typed into.
 */
function DangerZone({ onDeleted }: { onDeleted: () => void }) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)
  const [word, setWord] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const required = t('data.deleteAllWord')
  const armed = word.trim().toUpperCase() === required.toUpperCase()

  function startConfirming() {
    setDone(false)
    setError(null)
    setWord('')
    setConfirming(true)
  }

  function cancel() {
    setConfirming(false)
    setWord('')
  }

  async function handleDelete() {
    setBusy(true)
    setError(null)
    try {
      await repo.deleteAllData()
      setDone(true)
      setWord('')
      setConfirming(false)
      onDeleted()
    } catch {
      setError(t('auth.errorGeneric'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-6 rounded-[12px_9px_13px_8px] border-[1.5px] border-money-out bg-money-out/5 px-4 py-4">
      <h3 className="font-hand text-[1.4rem] leading-none text-money-out">
        {t('data.dangerTitle')}
      </h3>
      <p className="font-sketch mt-1 text-[0.78rem] leading-snug text-ink-soft">
        {t('data.deleteAllHint')}
      </p>

      {!confirming ? (
        <button
          type="button"
          onClick={startConfirming}
          className="mt-3 w-full rounded-[11px_8px_12px_9px] border-[1.5px] border-money-out px-4 py-2.5 text-money-out transition-colors hover:bg-money-out/10"
        >
          {t('data.deleteAll')}
        </button>
      ) : (
        <div className="mt-3">
          <label className="block">
            <span className="cell-label mb-1 block">{t('data.deleteAllConfirm')}</span>
            <input
              type="text"
              value={word}
              autoFocus
              onChange={(e) => setWord(e.target.value)}
              autoComplete="off"
              placeholder={required}
              className="w-full rounded-md border-[1.5px] border-money-out/50 bg-card px-3 py-2 outline-none focus:border-money-out"
            />
          </label>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={cancel}
              disabled={busy}
              className="flex-1 rounded-[11px_8px_12px_9px] border-[1.5px] border-ink-faint px-4 py-2.5 transition-colors hover:border-accent"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={!armed || busy}
              className="flex-1 rounded-[11px_8px_12px_9px] bg-money-out px-4 py-2.5 text-white transition-opacity disabled:opacity-40"
            >
              {busy ? t('data.deleting') : t('data.deleteAllConfirmButton')}
            </button>
          </div>
        </div>
      )}

      {done && (
        <p role="status" className="mt-2 text-[0.9rem] text-ink">
          {t('data.deleteAllDone')}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-[0.9rem] text-money-out">
          {error}
        </p>
      )}
    </div>
  )
}
