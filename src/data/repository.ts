/**
 * The one and only place that talks to the database.
 *
 * Everything else in the app calls these functions, never supabase directly.
 * That is the seam that makes the future offline mode a swap of this file's
 * internals (IndexedDB + an outbox) rather than a rewrite of the UI.
 */
import { supabase } from '../lib/supabase'
import type {
  ExpenseEntry,
  ExpensePatch,
  IncomeEntry,
  IncomePatch,
  LanguageCode,
  Profile,
  ThemeName,
} from './types'

/** numeric columns can arrive as strings depending on the transport; normalise
 *  once here so no caller ever has to think about it. */
function num(value: unknown): number {
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value ?? 0))
  return Number.isFinite(n) ? n : 0
}

function mapIncome(row: IncomeEntry): IncomeEntry {
  return {
    ...row,
    expected_amount: num(row.expected_amount),
    received_amount: num(row.received_amount),
  }
}

function mapExpense(row: ExpenseEntry): ExpenseEntry {
  return {
    ...row,
    amount_due: num(row.amount_due),
    amount_paid: num(row.amount_paid),
  }
}

export function newId(): string {
  return crypto.randomUUID()
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  // The signup trigger normally creates this; self-heal if it's missing (e.g.
  // an account created before the trigger existed).
  if (!data) {
    const { data: created, error: insertError } = await supabase
      .from('profiles')
      .insert({ id: userId })
      .select('*')
      .single()
    if (insertError) throw insertError
    return created as Profile
  }
  return data as Profile
}

export async function updateProfile(
  userId: string,
  patch: { language?: LanguageCode; theme?: ThemeName },
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select('*')
    .single()
  if (error) throw error
  return data as Profile
}

// ---------------------------------------------------------------------------
// Income
// ---------------------------------------------------------------------------

export async function fetchIncome(period: string): Promise<IncomeEntry[]> {
  const { data, error } = await supabase
    .from('income_entries')
    .select('*')
    .eq('period', period)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(mapIncome)
}

export async function fetchIncomeRange(periods: string[]): Promise<IncomeEntry[]> {
  if (periods.length === 0) return []
  const { data, error } = await supabase
    .from('income_entries')
    .select('*')
    .in('period', periods)
    .is('deleted_at', null)
    .order('period', { ascending: true })
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []).map(mapIncome)
}

export async function createIncome(
  row: Pick<IncomeEntry, 'id' | 'period'> & Partial<IncomeEntry>,
): Promise<IncomeEntry> {
  const { data, error } = await supabase.from('income_entries').insert(row).select('*').single()
  if (error) throw error
  return mapIncome(data as IncomeEntry)
}

export async function updateIncome(id: string, patch: IncomePatch): Promise<IncomeEntry> {
  const { data, error } = await supabase
    .from('income_entries')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapIncome(data as IncomeEntry)
}

/** Soft delete — keeps the row available to a future sync as a tombstone. */
export async function deleteIncome(id: string): Promise<void> {
  const { error } = await supabase
    .from('income_entries')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

export async function fetchExpenses(period: string): Promise<ExpenseEntry[]> {
  const { data, error } = await supabase
    .from('expense_entries')
    .select('*')
    .eq('period', period)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(mapExpense)
}

export async function fetchExpensesRange(periods: string[]): Promise<ExpenseEntry[]> {
  if (periods.length === 0) return []
  const { data, error } = await supabase
    .from('expense_entries')
    .select('*')
    .in('period', periods)
    .is('deleted_at', null)
    .order('period', { ascending: true })
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []).map(mapExpense)
}

export async function createExpense(
  row: Pick<ExpenseEntry, 'id' | 'period'> & Partial<ExpenseEntry>,
): Promise<ExpenseEntry> {
  const { data, error } = await supabase.from('expense_entries').insert(row).select('*').single()
  if (error) throw error
  return mapExpense(data as ExpenseEntry)
}

export async function updateExpense(id: string, patch: ExpensePatch): Promise<ExpenseEntry> {
  const { data, error } = await supabase
    .from('expense_entries')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapExpense(data as ExpenseEntry)
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase
    .from('expense_entries')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Danger zone
// ---------------------------------------------------------------------------

export async function deleteAllData(): Promise<void> {
  const { error } = await supabase.rpc('delete_all_my_data')
  if (error) throw error
}
