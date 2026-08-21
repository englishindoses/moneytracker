import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { ExpenseRow } from '../components/ExpenseRow'
import { IncomeRow } from '../components/IncomeRow'
import { SelectBox } from '../components/fields'
import { Money, moneyClass } from '../components/Money'
import {
  useAddExpense,
  useAddIncome,
  useDeleteExpense,
  useDeleteIncome,
  useExpenses,
  useIncome,
  usePasteRecurring,
  useUpdateExpense,
  useUpdateIncome,
  type PasteResult,
} from '../data/hooks'
import type { RecurringKind } from '../data/types'
import { currentPeriod, defaultDateFor, monthAndYear } from '../lib/months'
import { monthTotals } from '../lib/totals'
import { useSettings } from '../lib/settings'

type Tab = 'income' | 'expenses'

export function Month() {
  const { t } = useTranslation()
  const { language } = useSettings()
  const params = useParams<{ period: string }>()
  const period = /^\d{4}-\d{2}-01$/.test(params.period ?? '') ? params.period! : currentPeriod()

  const [tab, setTab] = useState<Tab>('income')

  const income = useIncome(period)
  const expenses = useExpenses(period)

  const addIncome = useAddIncome(period)
  const updateIncome = useUpdateIncome(period)
  const deleteIncome = useDeleteIncome(period)
  const addExpense = useAddExpense(period)
  const updateExpense = useUpdateExpense(period)
  const deleteExpense = useDeleteExpense(period)

  const paste = usePasteRecurring(period)
  const [pasted, setPasted] = useState<(PasteResult & { kind: RecurringKind }) | null>(null)

  function handlePaste(kind: RecurringKind) {
    setPasted(null)
    paste.mutate(kind, { onSuccess: (result) => setPasted({ ...result, kind }) })
  }

  const incomeRows = useMemo(() => income.data ?? [], [income.data])
  const expenseRows = useMemo(() => expenses.data ?? [], [expenses.data])

  const totals = useMemo(() => monthTotals(incomeRows, expenseRows), [incomeRows, expenseRows])

  /* --- selection ------------------------------------------------------------
     Ephemeral, and deliberately not persisted: it answers "what do these few
     add up to?", which is a question you ask and then stop asking. One set
     covers both tabs — ids are unique across them — so a selection made on the
     income tab is still there when you come back to it.                       */
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set())

  // A selection belongs to the month it was made in.
  useEffect(() => setSelectedIds(new Set()), [period])

  const setSelected = useCallback((id: string, on: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const setManySelected = useCallback((ids: string[], on: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (on) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }, [])

  // Filtering the live rows rather than trusting the set means an id left behind
  // by a deleted row simply stops counting, with no cleanup to get wrong.
  const selectedIncome = useMemo(
    () => incomeRows.filter((row) => selectedIds.has(row.id)),
    [incomeRows, selectedIds],
  )
  const selectedExpenses = useMemo(
    () => expenseRows.filter((row) => selectedIds.has(row.id)),
    [expenseRows, selectedIds],
  )
  const selectedTotals = useMemo(
    () => monthTotals(selectedIncome, selectedExpenses),
    [selectedIncome, selectedExpenses],
  )

  const tabRows = tab === 'income' ? incomeRows : expenseRows
  const tabSelected = tab === 'income' ? selectedIncome : selectedExpenses
  const allSelected = tabRows.length > 0 && tabSelected.length === tabRows.length

  const selectAllBox = (
    <SelectBox
      checked={allSelected}
      indeterminate={tabSelected.length > 0}
      onChange={(on) =>
        setManySelected(
          tabRows.map((row) => row.id),
          on,
        )
      }
      label={t('common.selectAll')}
    />
  )

  const loading = income.isLoading || expenses.isLoading
  const failed = income.isError || expenses.isError

  return (
    <div className="paper-dots relative min-h-dvh pb-24">
      <AppHeader
        title={monthAndYear(period, language)}
        backTo="/"
        backLabel={t('month.back')}
      />

      <main className="relative z-10 mx-auto max-w-3xl px-3">
        {/* --- month summary ------------------------------------------------ */}
        <section
          aria-label={t('totals.net')}
          className="sketch-box mb-4 grid grid-cols-1 gap-1 bg-card px-3 py-2.5 shadow-sm sm:grid-cols-3 sm:px-2 sm:py-3"
        >
          <Figure label={t('totals.totalExpected')} value={totals.expected} />
          <Figure label={t('totals.totalDue')} value={totals.due} />
          <Figure label={t('totals.net')} value={totals.net} emphasis />
        </section>

        {/* --- tabs --------------------------------------------------------- */}
        <div role="tablist" aria-label={t('months.title')} className="mb-3 flex gap-2">
          <TabButton active={tab === 'income'} onClick={() => setTab('income')} id="tab-income">
            {t('month.income')}
          </TabButton>
          <TabButton
            active={tab === 'expenses'}
            onClick={() => setTab('expenses')}
            id="tab-expenses"
          >
            {t('month.expenses')}
          </TabButton>
        </div>

        {failed && (
          <p role="alert" className="mb-3 text-center text-money-out">
            {t('common.errorLoading')}
          </p>
        )}
        {loading && <p className="py-6 text-center text-ink-soft">{t('common.loading')}</p>}

        {/* --- income ------------------------------------------------------- */}
        {tab === 'income' && !loading && (
          <section role="tabpanel" aria-labelledby="tab-income">
            <div className="row-income mb-1 hidden px-2 min-[700px]:grid">
              <span className="flex items-center justify-center [grid-area:sel]">
                {selectAllBox}
              </span>
              <span className="cell-label [grid-area:name]">{t('income.source')}</span>
              <span className="cell-label [grid-area:date]">{t('income.date')}</span>
              <span className="cell-label text-right [grid-area:expected]">
                {t('income.expected')}
              </span>
              <span className="cell-label text-right [grid-area:received]">
                {t('income.received')}
              </span>
              <span className="cell-label text-center [grid-area:tick]">✓</span>
              <span className="cell-label [grid-area:rdate]">{t('income.receivedDate')}</span>
            </div>

            <ul className="space-y-2">
              {incomeRows.map((entry) => (
                <IncomeRow
                  key={entry.id}
                  entry={entry}
                  onPatch={(patch) => updateIncome.mutate({ id: entry.id, patch })}
                  onDelete={() => deleteIncome.mutate(entry.id)}
                  selected={selectedIds.has(entry.id)}
                  onSelectedChange={(on) => setSelected(entry.id, on)}
                />
              ))}
            </ul>

            {incomeRows.length === 0 && (
              <p className="py-6 text-center text-ink-soft">{t('common.emptyIncome')}</p>
            )}

            <AddButton
              onClick={() =>
                addIncome.mutate({
                  expected_date: defaultDateFor(period),
                  sort_order: (income.data?.length ?? 0) + 1,
                })
              }
              pending={addIncome.isPending}
            >
              {t('income.addRow')}
            </AddButton>

            <PasteRow
              onPaste={() => handlePaste('income')}
              pending={paste.isPending}
              result={pasted?.kind === 'income' ? pasted : null}
            />

            <TotalsBar
              left={{ label: t('totals.stillExpected'), value: totals.stillExpected }}
              right={{ label: t('totals.received'), value: totals.received, tone: 'in' }}
              selection={
                selectedIncome.length > 0
                  ? {
                      count: selectedIncome.length,
                      left: {
                        label: t('totals.stillExpected'),
                        value: selectedTotals.stillExpected,
                      },
                      right: {
                        label: t('totals.received'),
                        value: selectedTotals.received,
                        tone: 'in',
                      },
                      allSelected,
                      onSelectAll: () => setManySelected(incomeRows.map((r) => r.id), true),
                      onClear: () => setManySelected(incomeRows.map((r) => r.id), false),
                    }
                  : null
              }
            />
          </section>
        )}

        {/* --- expenses ----------------------------------------------------- */}
        {tab === 'expenses' && !loading && (
          <section role="tabpanel" aria-labelledby="tab-expenses">
            <div className="row-expense mb-1 hidden px-2 min-[700px]:grid">
              <span className="flex items-center justify-center [grid-area:sel]">
                {selectAllBox}
              </span>
              <span className="cell-label [grid-area:name]">{t('expenses.name')}</span>
              <span className="cell-label [grid-area:date]">{t('expenses.dueDate')}</span>
              <span className="cell-label text-right [grid-area:due]">{t('expenses.due')}</span>
              <span className="cell-label text-right [grid-area:paid]">{t('expenses.paid')}</span>
              <span className="cell-label text-center [grid-area:tick]">✓</span>
            </div>

            <ul className="space-y-2">
              {expenseRows.map((entry) => (
                <ExpenseRow
                  key={entry.id}
                  entry={entry}
                  onPatch={(patch) => updateExpense.mutate({ id: entry.id, patch })}
                  onDelete={() => deleteExpense.mutate(entry.id)}
                  selected={selectedIds.has(entry.id)}
                  onSelectedChange={(on) => setSelected(entry.id, on)}
                />
              ))}
            </ul>

            {expenseRows.length === 0 && (
              <p className="py-6 text-center text-ink-soft">{t('common.emptyExpenses')}</p>
            )}

            <AddButton
              onClick={() =>
                addExpense.mutate({
                  due_date: defaultDateFor(period),
                  sort_order: (expenses.data?.length ?? 0) + 1,
                })
              }
              pending={addExpense.isPending}
            >
              {t('expenses.addRow')}
            </AddButton>

            <PasteRow
              onPaste={() => handlePaste('expense')}
              pending={paste.isPending}
              result={pasted?.kind === 'expense' ? pasted : null}
            />

            <TotalsBar
              left={{ label: t('totals.stillDue'), value: totals.stillDue }}
              right={{ label: t('totals.paid'), value: totals.paid, tone: 'in' }}
              selection={
                selectedExpenses.length > 0
                  ? {
                      count: selectedExpenses.length,
                      left: { label: t('totals.stillDue'), value: selectedTotals.stillDue },
                      right: { label: t('totals.paid'), value: selectedTotals.paid, tone: 'in' },
                      allSelected,
                      onSelectAll: () => setManySelected(expenseRows.map((r) => r.id), true),
                      onClear: () => setManySelected(expenseRows.map((r) => r.id), false),
                    }
                  : null
              }
            />
          </section>
        )}
      </main>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function Figure({
  label,
  value,
  emphasis = false,
}: {
  label: string
  value: number
  emphasis?: boolean
}) {
  return (
    // Three columns only once there is room for them. Squeezed into a third of a
    // phone, "R$ 8.420,00" wraps mid-number in the wider faces — as a label/value
    // row it stays on one line *and* keeps its full size.
    <div className="flex min-w-0 items-baseline justify-between gap-3 py-0.5 sm:block sm:px-1 sm:text-center">
      <span className="cell-label block">{label}</span>
      <span
        className={`tabular block leading-tight ${moneyClass(value)} ${
          emphasis ? 'text-[1.15rem] font-semibold' : 'text-[1.05rem]'
        }`}
      >
        {new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 2,
        }).format(value)}
      </span>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  id,
  children,
}: {
  active: boolean
  onClick: () => void
  id: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={active}
      onClick={onClick}
      className={`font-hand min-w-0 flex-1 break-words rounded-[12px_9px_13px_8px] border-[1.5px] px-3 py-2 text-[1.3rem] leading-tight transition-colors sm:px-4 sm:text-[1.5rem] ${
        active
          ? 'border-accent bg-accent-soft text-ink'
          : 'border-ink-faint bg-card text-ink-soft hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function AddButton({
  onClick,
  pending,
  children,
}: {
  onClick: () => void
  pending: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="font-sketch mt-3 flex w-full items-center justify-center gap-2 rounded-[12px_9px_13px_8px] border-[1.5px] border-dashed border-ink-faint px-4 py-2.5 text-ink-soft transition-colors hover:border-accent hover:text-ink disabled:opacity-60"
    >
      <span aria-hidden="true" className="text-lg leading-none">
        +
      </span>
      {children}
    </button>
  )
}

/** Paste the recurring list into this month, with a link to go and edit it. */
function PasteRow({
  onPaste,
  pending,
  result,
}: {
  onPaste: () => void
  pending: boolean
  result: PasteResult | null
}) {
  const { t } = useTranslation()

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          onClick={onPaste}
          disabled={pending}
          className="font-sketch flex-1 rounded-[9px_12px_8px_13px] border-[1.5px] border-ink-faint px-4 py-2 text-ink-soft transition-colors hover:border-accent hover:text-ink disabled:opacity-60"
        >
          {pending ? t('recurring.pasting') : t('recurring.paste')}
        </button>
        <Link
          to="/recurring"
          className="font-sketch px-1 text-[0.85rem] text-ink-soft underline decoration-ink-faint underline-offset-4 hover:text-ink"
        >
          {t('recurring.edit')}
        </Link>
      </div>

      {result && (
        <p role="status" className="font-sketch mt-1 px-1 text-[0.8rem] text-ink-soft">
          {result.added === 0 && result.skipped === 0
            ? t('recurring.pasteEmpty')
            : t('recurring.pasteDone', { added: result.added, skipped: result.skipped })}
        </p>
      )}
    </div>
  )
}

interface Figure {
  label: string
  value: number
  tone?: 'in' | 'plain'
}

interface Selection {
  count: number
  left: Figure
  right: Figure
  allSelected: boolean
  onSelectAll: () => void
  onClear: () => void
}

/**
 * Sticks to the bottom of the viewport so the totals are visible while you
 * scroll a long month on a phone.
 *
 * When rows are picked out, the same two figures for just those rows sit above
 * the month's — same labels, same order, so the pair can be read against each
 * other at a glance. The strip is also where select-all and clear live, since
 * the column header that would otherwise hold them does not exist on a phone.
 */
function TotalsBar({
  left,
  right,
  selection,
}: {
  left: Figure
  right: Figure
  selection: Selection | null
}) {
  const { t } = useTranslation()

  return (
    <div className="sticky bottom-0 z-20 -mx-3 mt-4 border-t-[1.5px] border-ink-faint bg-paper/95 px-4 py-2.5 backdrop-blur">
      <div className="mx-auto max-w-3xl">
        {selection && (
          <div className="mb-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-[8px] bg-accent-soft px-2.5 py-1.5">
            <span className="cell-label">
              {t('totals.selectedTotal')} · {selection.count}
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="cell-label">{selection.left.label}</span>
              <Money value={selection.left.value} tone={selection.left.tone} />
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="cell-label">{selection.right.label}</span>
              <Money value={selection.right.value} tone={selection.right.tone} />
            </span>
            <span className="ml-auto flex items-baseline gap-3">
              {!selection.allSelected && (
                <button
                  type="button"
                  onClick={selection.onSelectAll}
                  className="font-note text-[0.8rem] text-ink-soft underline decoration-ink-faint underline-offset-4 hover:text-ink"
                >
                  {t('common.selectAll')}
                </button>
              )}
              <button
                type="button"
                onClick={selection.onClear}
                className="font-note text-[0.8rem] text-ink-soft underline decoration-ink-faint underline-offset-4 hover:text-ink"
              >
                {t('common.clearSelection')}
              </button>
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <span className="flex items-baseline gap-2">
            <span className="cell-label">{left.label}</span>
            <Money value={left.value} tone={left.tone} className="text-[1.05rem]" />
          </span>
          <span className="flex items-baseline gap-2">
            <span className="cell-label">{right.label}</span>
            <Money value={right.value} tone={right.tone} className="text-[1.05rem]" />
          </span>
        </div>
      </div>
    </div>
  )
}
