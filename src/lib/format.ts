/** Everything is BRL, formatted pt-BR style (R$ 1.234,56) regardless of UI
 *  language — the app is used in Brazil, so the money should look Brazilian
 *  even when the interface is in English. */

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const brlPlain = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatMoney(value: number): string {
  return brl.format(value ?? 0)
}

/** Same digits, no currency symbol — for dense table cells and exports. */
export function formatAmount(value: number): string {
  return brlPlain.format(value ?? 0)
}

/**
 * Parses what a human actually types. Accepts "1.234,56", "1234,56",
 * "1234.56", "R$ 1.234,56" and returns 0 for anything unusable.
 *
 * The ambiguous case is a single separator with 3 trailing digits ("1.234"):
 * treated as a thousands separator, matching pt-BR expectations.
 */
export function parseAmount(input: string): number {
  if (!input) return 0
  let s = input.replace(/[^\d.,-]/g, '').trim()
  if (!s) return 0

  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')

  if (lastComma > -1 && lastDot > -1) {
    // Both present: the rightmost one is the decimal separator.
    const decimalSep = lastComma > lastDot ? ',' : '.'
    const thousandsSep = decimalSep === ',' ? '.' : ','
    s = s.split(thousandsSep).join('')
    s = s.replace(decimalSep, '.')
  } else if (lastComma > -1) {
    s = s.replace(',', '.')
  } else if (lastDot > -1) {
    const decimals = s.length - lastDot - 1
    // "1.234" is one thousand two hundred and thirty-four, not 1.234
    if (decimals === 3 && s.split('.').length === 2) s = s.replace('.', '')
  }

  const n = Number.parseFloat(s)
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100) / 100
}

/** ISO date (yyyy-mm-dd) → dd/mm/yyyy. Empty string for null. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}

/** Short form for cramped table cells: dd/mm. */
export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return ''
  const [, m, d] = iso.slice(0, 10).split('-')
  if (!m || !d) return ''
  return `${d}/${m}`
}

/**
 * The inverse of `formatDate`: what someone types in a date cell → ISO.
 * Day first, always — never month first, whatever the device's locale is set to.
 *
 * Deliberately liberal about separators, because people type dates every which
 * way: "5/12/2026", "05-12-26", "5.12.2026" and a bare run of digits
 * ("05122026", "051226") all land on the same day.
 *
 * Three-way return, so the caller can tell "cleared" from "I can't read that":
 *   string    → a valid date
 *   null      → the field was emptied
 *   undefined → unparseable; leave the stored value alone
 */
export function parseDate(input: string): string | null | undefined {
  const trimmed = input.trim()
  if (!trimmed) return null

  const parts = trimmed.split(/\D+/).filter(Boolean)
  let day: string
  let month: string
  let year: string

  if (parts.length === 3) {
    ;[day, month, year] = parts
  } else if (parts.length === 1 && (parts[0].length === 6 || parts[0].length === 8)) {
    // Typed straight through, no separators.
    day = parts[0].slice(0, 2)
    month = parts[0].slice(2, 4)
    year = parts[0].slice(4)
  } else {
    return undefined
  }

  const d = Number(day)
  const m = Number(month)
  // A two-digit year means this century: "26" is 2026, not 1926. This is a
  // budget for the months you are living through, so there is no back-history
  // to get wrong.
  let y = Number(year)
  if (year.length <= 2) y += 2000

  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) return undefined
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1000 || y > 9999) return undefined

  const iso = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  // Rejects 31/02 and friends: a real date survives the round trip unchanged.
  const probe = new Date(`${iso}T00:00:00Z`)
  if (
    Number.isNaN(probe.getTime()) ||
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() + 1 !== m ||
    probe.getUTCDate() !== d
  ) {
    return undefined
  }

  return iso
}
