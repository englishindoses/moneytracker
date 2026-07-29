import { formatAmount, formatMoney } from '../lib/format'

/**
 * The colour rules, in one place:
 *   negative               → red
 *   received / paid amount → green
 *   anything else          → default ink
 */
export function moneyClass(value: number, tone: 'in' | 'plain' = 'plain'): string {
  if (value < 0) return 'text-money-out'
  if (tone === 'in' && value > 0) return 'text-money-in'
  return 'text-ink'
}

interface MoneyProps {
  value: number
  tone?: 'in' | 'plain'
  /** Include the R$ symbol — used for headline figures, not table cells. */
  withSymbol?: boolean
  className?: string
}

export function Money({ value, tone = 'plain', withSymbol = false, className = '' }: MoneyProps) {
  return (
    <span className={`tabular ${moneyClass(value, tone)} ${className}`}>
      {withSymbol ? formatMoney(value) : formatAmount(value)}
    </span>
  )
}
