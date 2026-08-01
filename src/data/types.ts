export type ThemeName = 'neutral' | 'warm' | 'cool' | 'typewriter'
export type LanguageCode = 'en-GB' | 'pt-BR'

export interface Profile {
  id: string
  language: LanguageCode
  theme: ThemeName
  created_at: string
  updated_at: string
}

export interface IncomeEntry {
  id: string
  user_id: string
  period: string
  source: string
  expected_date: string | null
  expected_amount: number
  received_amount: number
  received_date: string | null
  notes: string | null
  sort_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ExpenseEntry {
  id: string
  user_id: string
  period: string
  name: string
  due_date: string | null
  amount_due: number
  amount_paid: number
  paid_date: string | null
  category: string | null
  notes: string | null
  sort_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/** Fields the UI is allowed to change on an existing row. */
export type IncomePatch = Partial<
  Pick<
    IncomeEntry,
    'source' | 'expected_date' | 'expected_amount' | 'received_amount' | 'received_date' | 'notes'
  >
>

export type ExpensePatch = Partial<
  Pick<
    ExpenseEntry,
    'name' | 'due_date' | 'amount_due' | 'amount_paid' | 'paid_date' | 'category' | 'notes'
  >
>

export type IncomeInsert = Pick<IncomeEntry, 'id' | 'period'> & Partial<IncomeEntry>
export type ExpenseInsert = Pick<ExpenseEntry, 'id' | 'period'> & Partial<ExpenseEntry>

/* -------------------------------------------------------------------------- */

export type RecurringKind = 'income' | 'expense'

/** A line on the reusable list. It is a template, not an entry: pasting it into
 *  a month copies these values into a real income/expense row and then forgets
 *  where they came from. */
export interface RecurringItem {
  id: string
  user_id: string
  kind: RecurringKind
  name: string
  /** 1–31, or null for "no particular day". Clamped to the month when pasted. */
  day_of_month: number | null
  amount: number
  sort_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type RecurringPatch = Partial<Pick<RecurringItem, 'name' | 'day_of_month' | 'amount'>>
