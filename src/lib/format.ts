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
