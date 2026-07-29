import type { ExpenseEntry, IncomeEntry } from '../data/types'

/**
 * The tick box is *derived*, never stored. Ticked means "the full amount is in".
 *
 * This single rule replaces a pile of edge cases: typing the full amount ticks
 * the box, a partial amount leaves it unticked, ticking fills the amount in,
 * unticking clears it, and editing the expected amount afterwards re-evaluates
 * automatically. No contradictory state is representable.
 */
export function isIncomeReceived(e: Pick<IncomeEntry, 'expected_amount' | 'received_amount'>) {
  return e.expected_amount > 0 && e.received_amount >= e.expected_amount
}

export function isExpensePaid(e: Pick<ExpenseEntry, 'amount_due' | 'amount_paid'>) {
  return e.amount_due > 0 && e.amount_paid >= e.amount_due
}

export interface MonthTotals {
  expected: number
  received: number
  due: number
  paid: number
  /** expected − due: positive is a surplus, negative a shortfall. */
  net: number
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

export function monthTotals(income: IncomeEntry[], expenses: ExpenseEntry[]): MonthTotals {
  const expected = round2(income.reduce((sum, e) => sum + e.expected_amount, 0))
  const received = round2(income.reduce((sum, e) => sum + e.received_amount, 0))
  const due = round2(expenses.reduce((sum, e) => sum + e.amount_due, 0))
  const paid = round2(expenses.reduce((sum, e) => sum + e.amount_paid, 0))
  return { expected, received, due, paid, net: round2(expected - due) }
}
