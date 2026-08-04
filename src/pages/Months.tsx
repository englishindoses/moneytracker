import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Money } from '../components/Money'
import { AppHeader } from '../components/AppHeader'
import { useExpensesRange, useIncomeRange } from '../data/hooks'
import { currentPeriod, currentYear, monthName, monthsOfYear } from '../lib/months'
import { monthTotals } from '../lib/totals'
import { useSettings } from '../lib/settings'

/** The index page: a year of months, like the future log at the front of a
 *  bullet journal. */
export function Months() {
  const { t } = useTranslation()
  const { language } = useSettings()
  const [year, setYear] = useState(currentYear)

  const periods = useMemo(() => monthsOfYear(year), [year])
  const income = useIncomeRange(periods)
  const expenses = useExpensesRange(periods)

  const byPeriod = useMemo(() => {
    const map = new Map<string, { expected: number; due: number; net: number; rows: number }>()
    for (const period of periods) {
      const inRows = (income.data ?? []).filter((r) => r.period === period)
      const outRows = (expenses.data ?? []).filter((r) => r.period === period)
      const totals = monthTotals(inRows, outRows)
      map.set(period, {
        expected: totals.expected,
        due: totals.due,
        net: totals.net,
        rows: inRows.length + outRows.length,
      })
    }
    return map
  }, [periods, income.data, expenses.data])

  const thisMonth = currentPeriod()
  const loading = income.isLoading || expenses.isLoading

  return (
    <div className="paper-dots relative min-h-dvh">
      <AppHeader title={t('months.title')} />

      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-16">
        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setYear((y) => y - 1)}
            aria-label={t('months.previousYear')}
            className="sketch-box px-3 py-1 text-ink-soft transition-colors hover:text-ink"
          >
            ‹
          </button>
          <h2 className="font-hand text-[2.4rem] leading-none">{year}</h2>
          <button
            type="button"
            onClick={() => setYear((y) => y + 1)}
            aria-label={t('months.nextYear')}
            className="sketch-box px-3 py-1 text-ink-soft transition-colors hover:text-ink"
          >
            ›
          </button>
        </div>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {periods.map((period) => {
            const summary = byPeriod.get(period)
            const isNow = period === thisMonth
            return (
              <li key={period}>
                <Link
                  to={`/m/${period}`}
                  className={`flex items-center justify-between gap-3 bg-card px-4 py-3.5 shadow-sm transition-transform active:scale-[0.99] ${
                    isNow ? 'sketch-box-accent' : 'sketch-box'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="font-hand block text-[1.7rem] capitalize leading-none">
                      {monthName(period, language)}
                    </span>
                    <span className="font-sketch mt-1 block text-[0.85rem] text-ink-soft">
                      {loading
                        ? t('common.loading')
                        : summary && summary.rows > 0
                          ? `${t('months.net')} `
                          : t('months.empty')}
                      {!loading && summary && summary.rows > 0 && (
                        <Money value={summary.net} className="text-[0.85rem]" />
                      )}
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-xl text-ink-soft">
                    ›
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>

        {(income.isError || expenses.isError) && (
          <p role="alert" className="mt-6 text-center text-money-out">
            {t('common.errorLoading')}
          </p>
        )}
      </main>
    </div>
  )
}
