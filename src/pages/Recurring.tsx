import { useTranslation } from 'react-i18next'
import { AppHeader } from '../components/AppHeader'
import { DeleteRowButton } from '../components/DeleteRowButton'
import { MoneyInput, TextInput } from '../components/fields'
import {
  useAddRecurring,
  useDeleteRecurring,
  useRecurring,
  useUpdateRecurring,
} from '../data/hooks'
import type { RecurringItem, RecurringKind } from '../data/types'

/**
 * The reusable list. Everything that comes in or goes out every month lives
 * here once; a month page then pastes it in with the dates moved onto that
 * month. Pasted rows are ordinary entries — editing one never comes back here.
 */
export function Recurring() {
  const { t } = useTranslation()

  return (
    <div className="paper-dots relative min-h-dvh pb-16">
      <AppHeader title={t('recurring.title')} backTo="/" backLabel={t('month.back')} />

      <main className="relative z-10 mx-auto max-w-3xl space-y-4 px-3">
        <p className="font-sketch px-1 text-[0.85rem] leading-snug text-ink-soft">
          {t('recurring.intro')}
        </p>
        <KindSection kind="income" />
        <KindSection kind="expense" />
      </main>
    </div>
  )
}

function KindSection({ kind }: { kind: RecurringKind }) {
  const { t } = useTranslation()
  const items = useRecurring(kind)
  const add = useAddRecurring(kind)
  const update = useUpdateRecurring(kind)
  const remove = useDeleteRecurring(kind)

  const rows = items.data ?? []

  return (
    <section className="sketch-box bg-card px-3 py-3 shadow-sm">
      <h2 className="font-hand mb-2 text-[1.7rem] leading-none">
        {kind === 'income' ? t('month.income') : t('month.expenses')}
      </h2>

      <div className="mb-1 hidden grid-cols-[minmax(0,1fr)_5.5rem_7rem_2rem] items-center gap-2 px-2 min-[560px]:grid">
        <span className="cell-label">
          {kind === 'income' ? t('income.source') : t('expenses.name')}
        </span>
        <span className="cell-label">{t('recurring.day')}</span>
        <span className="cell-label text-right">
          {kind === 'income' ? t('income.expected') : t('expenses.due')}
        </span>
        <span />
      </div>

      {items.isError && (
        <p role="alert" className="py-2 text-money-out">
          {t('common.errorLoading')}
        </p>
      )}
      {items.isLoading && <p className="py-4 text-center text-ink-soft">{t('common.loading')}</p>}

      <ul className="space-y-1">
        {rows.map((item) => (
          <Row
            key={item.id}
            item={item}
            onPatch={(patch) => update.mutate({ id: item.id, patch })}
            onDelete={() => remove.mutate(item.id)}
          />
        ))}
      </ul>

      {!items.isLoading && rows.length === 0 && (
        <p className="py-4 text-center text-ink-soft">{t('recurring.empty')}</p>
      )}

      <button
        type="button"
        onClick={() => add.mutate({ sort_order: rows.length + 1 })}
        disabled={add.isPending}
        className="font-sketch mt-2 flex w-full items-center justify-center gap-2 rounded-[12px_9px_13px_8px] border-[1.5px] border-dashed border-ink-faint px-4 py-2 text-ink-soft transition-colors hover:border-accent hover:text-ink disabled:opacity-60"
      >
        <span aria-hidden="true" className="text-lg leading-none">
          +
        </span>
        {kind === 'income' ? t('recurring.addIncome') : t('recurring.addExpense')}
      </button>
    </section>
  )
}

function Row({
  item,
  onPatch,
  onDelete,
}: {
  item: RecurringItem
  onPatch: (patch: Partial<Pick<RecurringItem, 'name' | 'day_of_month' | 'amount'>>) => void
  onDelete: () => void
}) {
  const { t } = useTranslation()

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_5.5rem_7rem_2rem] items-center gap-2 rounded-md px-2 py-1 odd:bg-accent-soft/40">
      <TextInput
        value={item.name}
        onCommit={(value) => onPatch({ name: value })}
        label={t('recurring.name')}
        placeholder={t('recurring.namePlaceholder')}
        className="font-hand text-[1.3rem]"
      />
      <DayInput value={item.day_of_month} onCommit={(day) => onPatch({ day_of_month: day })} />
      <MoneyInput
        value={item.amount}
        onCommit={(value) => onPatch({ amount: value })}
        label={t('recurring.amount')}
      />
      <div className="flex justify-end">
        <DeleteRowButton onConfirm={onDelete} name={item.name} />
      </div>
    </li>
  )
}

/** Day of the month, 1–31. Blank means "no date" — the pasted row simply gets
 *  no date and can be dated by hand later. */
function DayInput({
  value,
  onCommit,
}: {
  value: number | null
  onCommit: (day: number | null) => void
}) {
  const { t } = useTranslation()

  return (
    <input
      type="number"
      min={1}
      max={31}
      inputMode="numeric"
      aria-label={t('recurring.day')}
      value={value ?? ''}
      placeholder="—"
      onChange={(e) => {
        const raw = e.target.value.trim()
        if (raw === '') return onCommit(null)
        const day = Number.parseInt(raw, 10)
        if (Number.isFinite(day)) onCommit(Math.min(Math.max(day, 1), 31))
      }}
      className="tabular w-full rounded-md bg-transparent px-2 py-1.5 text-[15px] outline-none placeholder:text-ink-faint focus:bg-accent-soft"
    />
  )
}
