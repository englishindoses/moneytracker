/** Months are generated, never stored as their own rows: a month "exists"
 *  because the calendar says so. A row belongs to a month via `period`, the
 *  first day of that month as an ISO date. */

export type Period = string // 'yyyy-mm-01'

export function periodOf(year: number, monthIndex0: number): Period {
  return `${year}-${String(monthIndex0 + 1).padStart(2, '0')}-01`
}

export function currentPeriod(): Period {
  const now = new Date()
  return periodOf(now.getFullYear(), now.getMonth())
}

export function currentYear(): number {
  return new Date().getFullYear()
}

export function yearOf(period: Period): number {
  return Number(period.slice(0, 4))
}

export function monthIndexOf(period: Period): number {
  return Number(period.slice(5, 7)) - 1
}

/** All twelve periods of a year, January first. */
export function monthsOfYear(year: number): Period[] {
  return Array.from({ length: 12 }, (_, i) => periodOf(year, i))
}

export function periodRange(fromPeriod: Period, toPeriod: Period): Period[] {
  const out: Period[] = []
  let y = yearOf(fromPeriod)
  let m = monthIndexOf(fromPeriod)
  const endY = yearOf(toPeriod)
  const endM = monthIndexOf(toPeriod)
  // Guard against a reversed range producing an infinite loop.
  if (endY * 12 + endM < y * 12 + m) return [fromPeriod]
  while (y * 12 + m <= endY * 12 + endM) {
    out.push(periodOf(y, m))
    m += 1
    if (m > 11) {
      m = 0
      y += 1
    }
  }
  return out
}

/** Localised month name, e.g. "July" / "julho". */
export function monthName(period: Period, locale: string, style: 'long' | 'short' = 'long'): string {
  const d = new Date(Date.UTC(yearOf(period), monthIndexOf(period), 1))
  return new Intl.DateTimeFormat(locale, { month: style, timeZone: 'UTC' }).format(d)
}

export function monthAndYear(period: Period, locale: string): string {
  const d = new Date(Date.UTC(yearOf(period), monthIndexOf(period), 1))
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d)
}

/** Sensible default date for a new row: today if we're looking at the current
 *  month, otherwise the 1st of the month being viewed. */
export function defaultDateFor(period: Period): string {
  const now = new Date()
  if (periodOf(now.getFullYear(), now.getMonth()) === period) {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate(),
    ).padStart(2, '0')}`
  }
  return period
}

export function daysInPeriod(period: Period): number {
  return new Date(Date.UTC(yearOf(period), monthIndexOf(period) + 1, 0)).getUTCDate()
}

/** The nth day of a given month, as an ISO date. A day past the end of the
 *  month lands on its last day, so a recurring item due on the 31st still has
 *  somewhere to go in February. */
export function dateInPeriod(period: Period, day: number | null): string | null {
  if (day === null || !Number.isFinite(day)) return null
  const clamped = Math.min(Math.max(Math.trunc(day), 1), daysInPeriod(period))
  return `${period.slice(0, 8)}${String(clamped).padStart(2, '0')}`
}

export function isCurrentPeriod(period: Period): boolean {
  return period === currentPeriod()
}
