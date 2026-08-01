import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { dateInPeriod } from '../lib/months'
import * as repo from './repository'
import type {
  ExpenseEntry,
  ExpensePatch,
  IncomeEntry,
  IncomePatch,
  RecurringItem,
  RecurringKind,
  RecurringPatch,
} from './types'

export const keys = {
  income: (period: string) => ['income', period] as const,
  expenses: (period: string) => ['expenses', period] as const,
  incomeRange: (periods: string[]) => ['income-range', periods.join(',')] as const,
  expensesRange: (periods: string[]) => ['expenses-range', periods.join(',')] as const,
  recurring: (kind: RecurringKind) => ['recurring', kind] as const,
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function useIncome(period: string) {
  return useQuery({
    queryKey: keys.income(period),
    queryFn: () => repo.fetchIncome(period),
  })
}

export function useExpenses(period: string) {
  return useQuery({
    queryKey: keys.expenses(period),
    queryFn: () => repo.fetchExpenses(period),
  })
}

/** Used by the months list and the export preview. */
export function useIncomeRange(periods: string[], enabled = true) {
  return useQuery({
    queryKey: keys.incomeRange(periods),
    queryFn: () => repo.fetchIncomeRange(periods),
    enabled: enabled && periods.length > 0,
  })
}

export function useExpensesRange(periods: string[], enabled = true) {
  return useQuery({
    queryKey: keys.expensesRange(periods),
    queryFn: () => repo.fetchExpensesRange(periods),
    enabled: enabled && periods.length > 0,
  })
}

/** Range queries overlap the per-month ones, so any write has to invalidate
 *  both or the months list goes stale behind your back. */
function invalidatePeriod(qc: QueryClient, period: string, kind: 'income' | 'expenses') {
  void qc.invalidateQueries({ queryKey: [kind, period] })
  void qc.invalidateQueries({ queryKey: [`${kind}-range`] })
}

// ---------------------------------------------------------------------------
// Income writes
// ---------------------------------------------------------------------------

export function useAddIncome(period: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (row: Partial<IncomeEntry>) =>
      repo.createIncome({ id: repo.newId(), period, ...row }),
    onSuccess: () => invalidatePeriod(qc, period, 'income'),
  })
}

export function useUpdateIncome(period: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: IncomePatch }) => repo.updateIncome(id, patch),
    // Optimistic: typing in a cell should feel instant, and the totals below
    // recalculate from cache rather than waiting for a round trip.
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: keys.income(period) })
      const previous = qc.getQueryData<IncomeEntry[]>(keys.income(period))
      qc.setQueryData<IncomeEntry[]>(keys.income(period), (rows) =>
        (rows ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r)),
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(keys.income(period), context.previous)
    },
    onSettled: () => invalidatePeriod(qc, period, 'income'),
  })
}

export function useDeleteIncome(period: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => repo.deleteIncome(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: keys.income(period) })
      const previous = qc.getQueryData<IncomeEntry[]>(keys.income(period))
      qc.setQueryData<IncomeEntry[]>(keys.income(period), (rows) =>
        (rows ?? []).filter((r) => r.id !== id),
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(keys.income(period), context.previous)
    },
    onSettled: () => invalidatePeriod(qc, period, 'income'),
  })
}

// ---------------------------------------------------------------------------
// Expense writes
// ---------------------------------------------------------------------------

export function useAddExpense(period: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (row: Partial<ExpenseEntry>) =>
      repo.createExpense({ id: repo.newId(), period, ...row }),
    onSuccess: () => invalidatePeriod(qc, period, 'expenses'),
  })
}

export function useUpdateExpense(period: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ExpensePatch }) =>
      repo.updateExpense(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: keys.expenses(period) })
      const previous = qc.getQueryData<ExpenseEntry[]>(keys.expenses(period))
      qc.setQueryData<ExpenseEntry[]>(keys.expenses(period), (rows) =>
        (rows ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r)),
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(keys.expenses(period), context.previous)
    },
    onSettled: () => invalidatePeriod(qc, period, 'expenses'),
  })
}

export function useDeleteExpense(period: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => repo.deleteExpense(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: keys.expenses(period) })
      const previous = qc.getQueryData<ExpenseEntry[]>(keys.expenses(period))
      qc.setQueryData<ExpenseEntry[]>(keys.expenses(period), (rows) =>
        (rows ?? []).filter((r) => r.id !== id),
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(keys.expenses(period), context.previous)
    },
    onSettled: () => invalidatePeriod(qc, period, 'expenses'),
  })
}

// ---------------------------------------------------------------------------
// Recurring list
// ---------------------------------------------------------------------------

export function useRecurring(kind: RecurringKind) {
  return useQuery({
    queryKey: keys.recurring(kind),
    queryFn: () => repo.fetchRecurring(kind),
  })
}

export function useAddRecurring(kind: RecurringKind) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (row: Partial<RecurringItem>) =>
      repo.createRecurring({ id: repo.newId(), kind, ...row }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.recurring(kind) }),
  })
}

export function useUpdateRecurring(kind: RecurringKind) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: RecurringPatch }) =>
      repo.updateRecurring(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: keys.recurring(kind) })
      const previous = qc.getQueryData<RecurringItem[]>(keys.recurring(kind))
      qc.setQueryData<RecurringItem[]>(keys.recurring(kind), (rows) =>
        (rows ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r)),
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(keys.recurring(kind), context.previous)
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: keys.recurring(kind) }),
  })
}

export function useDeleteRecurring(kind: RecurringKind) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => repo.deleteRecurring(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: keys.recurring(kind) })
      const previous = qc.getQueryData<RecurringItem[]>(keys.recurring(kind))
      qc.setQueryData<RecurringItem[]>(keys.recurring(kind), (rows) =>
        (rows ?? []).filter((r) => r.id !== id),
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(keys.recurring(kind), context.previous)
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: keys.recurring(kind) }),
  })
}

export interface PasteResult {
  added: number
  skipped: number
}

/**
 * Copies the recurring list into one month.
 *
 * Names already present in that month are skipped, so pressing the button twice
 * (or pasting after adding a few rows by hand) tops the month up instead of
 * duplicating it. Everything pasted is an ordinary, fully editable entry.
 */
export function usePasteRecurring(period: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (kind: RecurringKind): Promise<PasteResult> => {
      const items = await repo.fetchRecurring(kind)
      const named = items.filter((item) => item.name.trim() !== '')
      if (named.length === 0) return { added: 0, skipped: 0 }

      if (kind === 'income') {
        const existing = await repo.fetchIncome(period)
        const taken = new Set(existing.map((r) => r.source.trim().toLowerCase()))
        const fresh = named.filter((item) => !taken.has(item.name.trim().toLowerCase()))
        let order = existing.reduce((max, r) => Math.max(max, r.sort_order), 0)
        await repo.createIncomeMany(
          fresh.map((item) => ({
            id: repo.newId(),
            period,
            source: item.name,
            expected_date: dateInPeriod(period, item.day_of_month),
            expected_amount: item.amount,
            sort_order: ++order,
          })),
        )
        return { added: fresh.length, skipped: named.length - fresh.length }
      }

      const existing = await repo.fetchExpenses(period)
      const taken = new Set(existing.map((r) => r.name.trim().toLowerCase()))
      const fresh = named.filter((item) => !taken.has(item.name.trim().toLowerCase()))
      let order = existing.reduce((max, r) => Math.max(max, r.sort_order), 0)
      await repo.createExpenseMany(
        fresh.map((item) => ({
          id: repo.newId(),
          period,
          name: item.name,
          due_date: dateInPeriod(period, item.day_of_month),
          amount_due: item.amount,
          sort_order: ++order,
        })),
      )
      return { added: fresh.length, skipped: named.length - fresh.length }
    },
    onSuccess: (_result, kind) => invalidatePeriod(qc, period, kind === 'income' ? 'income' : 'expenses'),
  })
}
