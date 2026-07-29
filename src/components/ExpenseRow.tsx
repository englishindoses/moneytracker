import { useTranslation } from 'react-i18next'
import { DateInput, MoneyInput, TextInput, TickBox } from './fields'
import { DeleteRowButton } from './DeleteRowButton'
import type { ExpenseEntry, ExpensePatch } from '../data/types'
import { isExpensePaid } from '../lib/totals'

interface ExpenseRowProps {
  entry: ExpenseEntry
  onPatch: (patch: ExpensePatch) => void
  onDelete: () => void
}

const LABEL = 'cell-label min-[700px]:hidden'

/** Mirrors IncomeRow exactly, as specified — same tick behaviour, same layout
 *  rules, minus the "received on" column. */
export function ExpenseRow({ entry, onPatch, onDelete }: ExpenseRowProps) {
  const { t } = useTranslation()
  const paid = isExpensePaid(entry)

  function handleTick(checked: boolean) {
    if (checked) {
      onPatch({
        amount_paid: entry.amount_due,
        paid_date: entry.paid_date ?? new Date().toISOString().slice(0, 10),
      })
    } else {
      onPatch({ amount_paid: 0, paid_date: null })
    }
  }

  function handlePaidAmount(value: number) {
    const nowFull = entry.amount_due > 0 && value >= entry.amount_due
    onPatch({
      amount_paid: value,
      paid_date:
        nowFull && !entry.paid_date
          ? new Date().toISOString().slice(0, 10)
          : value === 0
            ? null
            : entry.paid_date,
    })
  }

  return (
    <li className="row-expense sketch-box grid overflow-hidden bg-card px-2 py-2 shadow-sm">
      <div className="[grid-area:name] min-w-0">
        <TextInput
          value={entry.name}
          onCommit={(value) => onPatch({ name: value })}
          label={t('expenses.name')}
          placeholder={t('expenses.newExpense')}
          className="font-hand text-[1.35rem] min-[700px]:text-[1.2rem]"
        />
      </div>

      <div className="flex min-w-0 items-center gap-1.5 [grid-area:date]">
        <span className={LABEL}>{t('expenses.dueDate')}</span>
        <div className="min-w-0 flex-1">
          <DateInput
            value={entry.due_date}
            onCommit={(value) => onPatch({ due_date: value })}
            label={t('expenses.dueDate')}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-col [grid-area:due] min-[700px]:block">
        <span className={`${LABEL} px-2 text-right`}>{t('expenses.due')}</span>
        <MoneyInput
          value={entry.amount_due}
          onCommit={(value) => onPatch({ amount_due: value })}
          label={t('expenses.due')}
        />
      </div>

      {/* On phones this row spans the full width, so the label sits inline. */}
      <div className="flex min-w-0 items-center gap-1.5 [grid-area:paid] min-[700px]:block">
        <span className={LABEL}>{t('expenses.paid')}</span>
        <div className="min-w-0 flex-1">
          <MoneyInput
            value={entry.amount_paid}
            onCommit={handlePaidAmount}
            label={t('expenses.paid')}
            positive
          />
        </div>
      </div>

      <div className="flex items-center justify-center [grid-area:tick]">
        <TickBox checked={paid} onChange={handleTick} label={t('expenses.paidTick')} />
      </div>

      <div className="flex items-start justify-end [grid-area:del]">
        <DeleteRowButton onConfirm={onDelete} name={entry.name} />
      </div>
    </li>
  )
}
